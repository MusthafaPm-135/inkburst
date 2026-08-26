const db = require("../config/db");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const { PDFDocument, StandardFonts, rgb, degrees } = require("pdf-lib");
const cloudinary = require("../config/cloudinary");
const Razorpay = require("razorpay");
const { sendPurchaseInvoice } = require("../services/invoiceEmailService");
const { calculateCoupon } = require("../services/couponService");

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

const query = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => error ? reject(error) : resolve(results));
});

const getCartItems = (userId) => query(
    `SELECT cart.comic_id, comics.title, comics.author, comics.price
     FROM cart JOIN comics ON cart.comic_id = comics.id
     WHERE cart.user_id = ?`,
    [userId]
);

let accessLogTableReady;
const ensureAccessLogTable = () => {
    if (!accessLogTableReady) accessLogTableReady = query(`CREATE TABLE IF NOT EXISTS comic_access_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
        comic_id INT NOT NULL, order_id INT NOT NULL, ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(512) NULL, watermark_label VARCHAR(255) NOT NULL,
        accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX comic_access_logs_comic_accessed (comic_id, accessed_at)
    )`);
    return accessLogTableReady;
};
const clientIp = (req) => String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim().slice(0, 45);
const logComicAccess = async (req, purchase, watermarkLabel) => {
    await ensureAccessLogTable();
    await query(`INSERT INTO comic_access_logs (user_id, comic_id, order_id, ip_address, user_agent, watermark_label)
        VALUES (?, ?, ?, ?, ?, ?)`, [req.user.id, purchase.comic_id, purchase.order_id, clientIp(req),
        String(req.get("user-agent") || "").slice(0, 512), watermarkLabel.slice(0, 255)]);
};

console.log("✅ USING orderController.js - UPDATED VERSION");

// ==========================================
// CHECKOUT
// ==========================================
exports.checkout = (req, res) => {
    return res.status(410).json({
        success: false,
        message: "Use the secure payment flow to complete your order."
    });
};

// Create the Razorpay order on the server, using prices from the database.
// Never accept a total sent by the browser.
exports.createPayment = async (req, res) => {
    const razorpay = getRazorpay();
    if (!razorpay) {
        return res.status(503).json({ success: false, message: "Payments are not configured yet. Add Razorpay keys on the server." });
    }

    try {
        const cartItems = await getCartItems(req.user.id);
        if (!cartItems.length) return res.status(400).json({ success: false, message: "Your cart is empty." });

        const subtotalPaise = Math.round(cartItems.reduce((sum, item) => sum + Number(item.price), 0) * 100);
        const pricing = await calculateCoupon(req.body?.couponCode, subtotalPaise);
        if (pricing.totalPaise < 100) return res.status(400).json({ success: false, message: "The order total must be at least ₹1.00." });

        const order = await razorpay.orders.create({
            amount: pricing.totalPaise,
            currency: "INR",
            receipt: `keyra_${req.user.id}_${Date.now()}`,
            notes: {
                user_id: String(req.user.id),
                coupon_code: pricing.code,
                subtotal_paise: String(pricing.subtotalPaise),
                discount_paise: String(pricing.discountPaise)
            }
        });
        return res.json({ success: true, key: process.env.RAZORPAY_KEY_ID, order, itemCount: cartItems.length, pricing: { subtotal: pricing.subtotalPaise / 100, discount: pricing.discountPaise / 100, total: pricing.totalPaise / 100, code: pricing.code } });
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        return res.status(500).json({ success: false, message: "Could not start the payment. Please try again." });
    }
};

// Verify Razorpay's HMAC signature before unlocking comics. This endpoint is
// the only path that creates Paid orders.
exports.verifyPayment = async (req, res) => {
    const razorpay = getRazorpay();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification details are missing." });
    }

    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))) {
        return res.status(400).json({ success: false, message: "Payment signature is invalid." });
    }

    try {
        const paymentOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (String(paymentOrder.notes?.user_id) !== String(req.user.id) || paymentOrder.status !== "paid") {
            return res.status(400).json({ success: false, message: "This payment cannot be used for this account." });
        }

        const cartItems = await getCartItems(req.user.id);
        if (!cartItems.length) return res.json({ success: true, message: "Your purchase is already available in your library." });
        const subtotalPaise = Math.round(cartItems.reduce((sum, item) => sum + Number(item.price), 0) * 100);
        const pricing = await calculateCoupon(paymentOrder.notes?.coupon_code, subtotalPaise);
        if (pricing.totalPaise !== paymentOrder.amount) {
            return res.status(409).json({ success: false, message: "Your cart changed while payment was in progress. Please contact support with your payment ID." });
        }

        const connection = await db.promise().getConnection();
        try {
            await connection.beginTransaction();
            if (pricing.coupon) {
                const [couponUpdate] = await connection.query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND active = 1
                    AND (starts_at IS NULL OR starts_at <= NOW()) AND (expires_at IS NULL OR expires_at >= NOW())
                    AND (usage_limit IS NULL OR used_count < usage_limit)`, [pricing.coupon.id]);
                if (!couponUpdate.affectedRows) throw new Error("Coupon became unavailable before payment completed.");
            }
            let allocatedPaise = 0;
            for (let index = 0; index < cartItems.length; index += 1) {
                const item = cartItems[index];
                const itemPaidPaise = index === cartItems.length - 1
                    ? pricing.totalPaise - allocatedPaise
                    : Math.round(Number(item.price) * 100 * pricing.totalPaise / pricing.subtotalPaise);
                allocatedPaise += itemPaidPaise;
                item.paidPrice = itemPaidPaise / 100;
                await connection.query(
                    `INSERT INTO orders (user_id, comic_id, price, payment_status)
                     SELECT ?, ?, ?, 'Paid' WHERE NOT EXISTS
                     (SELECT 1 FROM orders WHERE user_id = ? AND comic_id = ? AND payment_status = 'Paid')`,
                    [req.user.id, item.comic_id, item.paidPrice, req.user.id, item.comic_id]
                );
            }
            await connection.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        const users = await query("SELECT username, email FROM users WHERE id = ? LIMIT 1", [req.user.id]);
        const invoiceResult = await sendPurchaseInvoice({
            customer: users[0],
            items: cartItems.map((item) => ({ ...item, price: item.paidPrice })),
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id
        }).catch((emailError) => {
            console.error("INVOICE EMAIL ERROR:", emailError.message);
            return { sent: false };
        });
        return res.json({
            success: true,
            message: invoiceResult.sent
                ? "Payment verified. Your comics are now in your library and your invoice was emailed."
                : "Payment verified. Your comics are now in your library."
        });
    } catch (error) {
        console.error("Payment verification failed:", error);
        return res.status(500).json({ success: false, message: "We could not finish your order. Please contact support with your payment ID." });
    }
};

/*

    const userId = req.user.id;

    console.log("User:", userId);

    db.query(
        `SELECT cart.*, comics.price
         FROM cart
         JOIN comics
         ON cart.comic_id = comics.id
         WHERE cart.user_id = ?`,
        [userId],
        (err, cartItems) => {

            console.log("Cart Items:", cartItems);

            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    error: err
                });
            }

            if (cartItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cart is empty"
                });
            }

            let completed = 0;

            cartItems.forEach(item => {

                db.query(
                    `INSERT INTO orders
                    (user_id, comic_id, price, payment_status)
                    VALUES (?, ?, ?, ?)`,
                    [
                        userId,
                        item.comic_id,
                        item.price,
                        "Paid"
                    ],
                    (err, result) => {

                        console.log("INSERT ERROR:", err);
                        console.log("INSERT RESULT:", result);

                        if (err) {
                            return res.status(500).json({
                                success: false,
                                error: err
                            });
                        }

                        completed++;

                        if (completed === cartItems.length) {

                            db.query(
                                "DELETE FROM cart WHERE user_id = ?",
                                [userId],
                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            error: err
                                        });
                                    }

                                    res.json({
                                        success: true,
                                        message: "Checkout completed successfully"
                                    });

                                }
                            );

                        }

                    }
                );

            });

        }
    );
*/

// ==========================================
// RECOVER A CAPTURED PAYMENT IF THE BROWSER CLOSED BEFORE VERIFICATION
// ==========================================
exports.recoverPurchase = async (req, res) => {
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: "Payments are not configured." });

    try {
        const cartItems = await getCartItems(req.user.id);
        if (!cartItems.length) return res.json({ success: true, recovered: false });

        const subtotalPaise = Math.round(cartItems.reduce((sum, item) => sum + Number(item.price), 0) * 100);
        const paymentList = await razorpay.payments.all({ count: 100 });
        const payment = (paymentList.items || []).find((item) =>
            item.status === "captured" &&
            String(item.notes?.user_id) === String(req.user.id) &&
            item.order_id
        );

        if (!payment) return res.json({ success: true, recovered: false });

        const paymentOrder = await razorpay.orders.fetch(payment.order_id);
        if (
            paymentOrder.status !== "paid" ||
            Number(paymentOrder.notes?.subtotal_paise) !== subtotalPaise ||
            Number(paymentOrder.amount) !== Number(payment.amount)
        ) {
            return res.json({ success: true, recovered: false });
        }

        const connection = await db.promise().getConnection();
        try {
            await connection.beginTransaction();
            let allocatedPaise = 0;
            for (let index = 0; index < cartItems.length; index += 1) {
                const item = cartItems[index];
                const paidPaise = index === cartItems.length - 1
                    ? Number(payment.amount) - allocatedPaise
                    : Math.round(Number(item.price) * 100 * Number(payment.amount) / subtotalPaise);
                allocatedPaise += paidPaise;
                await connection.query(
                    `INSERT INTO orders (user_id, comic_id, price, payment_status)
                     SELECT ?, ?, ?, 'Paid' WHERE NOT EXISTS
                     (SELECT 1 FROM orders WHERE user_id = ? AND comic_id = ? AND payment_status = 'Paid')`,
                    [req.user.id, item.comic_id, paidPaise / 100, req.user.id, item.comic_id]
                );
            }
            await connection.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        return res.json({ success: true, recovered: true });
    } catch (error) {
        console.error("Payment recovery failed:", error);
        return res.status(500).json({ success: false, message: "Could not recover this payment automatically." });
    }
};

// ==========================================
// GET MY ORDERS
// ==========================================
exports.getOrders = (req, res) => {

    const userId = req.user.id;

    db.query(
        `SELECT
            orders.id,
            orders.price,
            orders.payment_status,
            orders.purchased_at,
            comics.id AS comic_id,
            comics.title,
            comics.author,
            comics.cover_image,
            comics.pdf_file
        FROM orders
        JOIN comics
        ON orders.comic_id = comics.id
         WHERE orders.user_id = ?
         AND orders.payment_status = 'Paid'
         ORDER BY orders.purchased_at DESC`,
        [userId],
        (err, orders) => {

            console.log("ORDERS:", orders);

            if (err) {
                console.log(err);

                return res.status(500).json({
                    success: false,
                    error: err
                });
            }

            res.json({
                success: true,
                orders
            });

        }
    );

};
// ==========================================
// READ PURCHASED COMIC
// ==========================================
const downloadCloudinaryPdf = (storedPublicId) => new Promise((resolve, reject) => {
    // For raw Cloudinary assets, the extension is part of the public ID.
    // Keep it intact while also declaring the download format.
    const downloadUrl = cloudinary.utils.private_download_url(storedPublicId, "pdf", {
        resource_type: "raw",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + (5 * 60)
    });

    https.get(downloadUrl, (fileResponse) => {
        if (fileResponse.statusCode !== 200) {
            console.error("Cloud PDF download failed:", fileResponse.statusCode, fileResponse.headers["x-cld-error"] || "");
            fileResponse.resume();
            return reject(new Error("Cloudinary could not find the comic file."));
        }
        const chunks = [];
        fileResponse.on("data", (chunk) => chunks.push(chunk));
        fileResponse.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
});

const watermarkPdf = async (pdfBuffer, watermarkLabel) => {
    const document = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await document.embedFont(StandardFonts.HelveticaBold);
    document.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkLabel, { x: width * 0.08, y: height * 0.08, size: Math.max(8, Math.min(13, width / 42)), font, color: rgb(0.55, 0.05, 0.05), opacity: 0.42, rotate: degrees(35) });
    });
    return Buffer.from(await document.save());
};

exports.readComic = (req, res) => {

    const userId = req.user.id;
    const comicId = req.params.comicId;

    console.log("===== READ COMIC =====");
    console.log("User:", userId);
    console.log("Comic:", comicId);

    db.query(
        `SELECT comics.pdf_file, comics.id AS comic_id, orders.id AS order_id, users.email, users.username
         FROM orders
         JOIN comics
         ON orders.comic_id = comics.id
         JOIN users ON orders.user_id = users.id
         WHERE orders.user_id = ?
         AND orders.comic_id = ?
         AND orders.payment_status = 'Paid'`,
        [userId, comicId],
        async (err, result) => {

            console.log("READ RESULT:", result);

            if (err) {
                console.log(err);

                return res.status(500).json({
                    success: false,
                    error: err
                });
            }

            if (result.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You have not purchased this comic."
                });
            }

            const storedPdf = result[0].pdf_file;
            if (storedPdf?.startsWith("cloudinary:")) {
                const purchase = result[0];
                const watermarkLabel = `Licensed to ${purchase.email || purchase.username || `User ${userId}`} | Order #${purchase.order_id}`;
                try {
                    const sourcePdf = await downloadCloudinaryPdf(storedPdf.slice("cloudinary:".length));
                    const watermarkedPdf = await watermarkPdf(sourcePdf, watermarkLabel);
                    await logComicAccess(req, purchase, watermarkLabel);
                    res.setHeader("Content-Type", "application/pdf");
                    res.setHeader("Content-Disposition", "inline");
                    res.setHeader("Cache-Control", "private, no-store");
                    return res.send(watermarkedPdf);
                } catch (error) {
                    console.error("Watermarked comic delivery failed:", error.message);
                    return res.status(502).json({ success: false, message: "The comic file could not be loaded." });
                }
            }

            const pdfPath = path.join(__dirname, "../uploads/pdfs", storedPdf);
            console.log("Opening PDF:", pdfPath);
            return res.sendFile(pdfPath, (sendError) => {
                if (sendError && !res.headersSent) {
                    return res.status(404).json({ success: false, message: "This comic file is no longer available. Please contact support." });
                }
            });

        }
    );

};

