const db = require("../config/db");
const path = require("path");
const crypto = require("crypto");
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
exports.readComic = (req, res) => {

    const userId = req.user.id;
    const comicId = req.params.comicId;

    console.log("===== READ COMIC =====");
    console.log("User:", userId);
    console.log("Comic:", comicId);

    db.query(
        `SELECT comics.pdf_file
         FROM orders
         JOIN comics
         ON orders.comic_id = comics.id
         WHERE orders.user_id = ?
         AND orders.comic_id = ?
         AND orders.payment_status = 'Paid'`,
        [userId, comicId],
        (err, result) => {

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

            const pdfPath = path.join(
                __dirname,
                "../uploads/pdfs",
                result[0].pdf_file
            );

            console.log("Opening PDF:", pdfPath);

            res.sendFile(pdfPath);

        }
    );

};
