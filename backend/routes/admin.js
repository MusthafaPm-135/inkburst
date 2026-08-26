const express = require("express");
const router = express.Router();

const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// =============================
// Create upload folders if missing
// =============================
const coverDir = path.join(__dirname, "../uploads/covers");
const pdfDir = path.join(__dirname, "../uploads/pdfs");

if (!fs.existsSync(coverDir)) {
    fs.mkdirSync(coverDir, { recursive: true });
}

if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
}

// =============================
// Multer Storage
// =============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        if (file.fieldname === "cover_image") {
            cb(null, coverDir);
        } else if (file.fieldname === "pdf_file") {
            cb(null, pdfDir);
        } else {
            cb(new Error("Unknown file field"));
        }

    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }

});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const validImage = file.fieldname === "cover_image" && file.mimetype.startsWith("image/");
        const validPdf = file.fieldname === "pdf_file" && file.mimetype === "application/pdf";

        if (validImage || validPdf) {
            return cb(null, true);
        }

        cb(new Error("Cover images must be image files and comic files must be PDFs"));
    }
});

const validateComicDetails = ({ title, author, genre, price, description }) => {
    if (!title?.trim() || !author?.trim() || !genre?.trim() || !description?.trim()) {
        return "Title, author, genre, and description are required";
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return "Price must be a valid non-negative number";
    }

    return null;
};

const uploadCoverToCloudinary = async (file) => {
    const result = await cloudinary.uploader.upload(file.path, {
        folder: "keyra-comics/covers",
        resource_type: "image"
    });
    fs.unlink(file.path, () => {});
    return result.secure_url;
};

const isRemoteUrl = (value) => /^https?:\/\\//i.test(value || "");

const invoicePdf = async (order) => {
    const document = await PDFDocument.create(); const page = document.addPage([595.28, 841.89]);
    const regular = await document.embedFont(StandardFonts.Helvetica); const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const text = (value, x, y, size = 11, font = regular, color = rgb(0.12, 0.1, 0.17)) => page.drawText(String(value || ""), { x, y, size, font, color });
    const money = `INR ${Number(order.price).toFixed(2)}`;
    text("KEYRA COMICS", 48, 780, 24, bold); text("DIGITAL COMIC PURCHASE INVOICE", 48, 758, 9, bold, rgb(0.72, 0.1, 0.25));
    page.drawLine({ start: { x: 48, y: 738 }, end: { x: 547, y: 738 }, thickness: 1, color: rgb(0.8, 0.78, 0.83) });
    text("Billed to", 48, 704, 10, bold); text(order.username || "Customer", 48, 684); text(order.email || "", 48, 666, 10);
    text("Invoice", 370, 704, 10, bold); text(`KEYRA-${order.id}`, 370, 684); text("Purchase date", 370, 654, 10, bold);
    text(new Date(order.purchased_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), 370, 636, 9);
    page.drawRectangle({ x: 48, y: 540, width: 499, height: 56, color: rgb(0.97, 0.96, 0.98), borderColor: rgb(0.82, 0.8, 0.85), borderWidth: 1 });
    text("Comic", 62, 576, 9, bold); text("Author", 275, 576, 9, bold); text("Amount", 467, 576, 9, bold);
    text(order.title, 62, 552, 11, bold); text(order.author || "Keyra Comics", 275, 552); text(money, 467, 552, 11, bold);
    text("Amount paid", 360, 490, 13, bold); text(money, 467, 490, 13, bold);
    page.drawLine({ start: { x: 360, y: 482 }, end: { x: 547, y: 482 }, thickness: 1.2, color: rgb(0.12, 0.1, 0.17) });
    text("Payment status: PAID", 48, 418, 11, bold, rgb(0.1, 0.35, 0.15));
    text("This invoice confirms access to a digital comic purchased from Keyra Comics.", 48, 92, 9, regular, rgb(0.35, 0.32, 0.4));
    return Buffer.from(await document.save());
};

const uploadPdfToCloudinary = async (file) => {
    const result = await cloudinary.uploader.upload(file.path, {
        folder: "keyra-comics/pdfs",
        resource_type: "raw",
        type: "authenticated",
        use_filename: true,
        unique_filename: true
    });
    fs.unlink(file.path, () => {});
    return `cloudinary:${result.public_id}`;
};

// =============================
// Test Route
// =============================
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Admin route connected"
    });
});

// =============================
// Apply Middleware
// =============================
router.use(auth);
router.use(admin);

// =============================
// Dashboard Stats
// =============================
router.get("/stats", (req, res) => {

    db.query("SELECT COUNT(*) AS totalComics FROM comics", (err, comics) => {

        if (err) {
            return res.status(500).json(err);
        }

        db.query("SELECT COUNT(*) AS totalUsers FROM users", (err, users) => {

            if (err) {
                return res.status(500).json(err);
            }

            db.query("SELECT COUNT(*) AS totalOrders FROM orders", (err, orders) => {

                if (err) {
                    return res.status(500).json(err);
                }

                db.query(
                    "SELECT IFNULL(SUM(price), 0) AS totalRevenue FROM orders WHERE payment_status = 'Paid'",
                    (err, revenue) => {

                        if (err) {
                            return res.status(500).json(err);
                        }

                        res.json({
                            success: true,
                            stats: {
                                totalComics: comics[0].totalComics,
                                totalUsers: users[0].totalUsers,
                                totalOrders: orders[0].totalOrders,
                                totalRevenue: revenue[0].totalRevenue
                            }
                        });

                    }
                );

            });

        });

    });

});

// =============================
// Registered Users List
// =============================
router.get("/users", (req, res) => {
    db.query(
        "SELECT id, username, email, role, created_at FROM users ORDER BY id DESC",
        (err, users) => {
            if (err) {
                // Fallback if created_at column is absent
                db.query(
                    "SELECT id, username, email, role FROM users ORDER BY id DESC",
                    (fallbackErr, fallbackUsers) => {
                        if (fallbackErr) {
                            return res.status(500).json({ success: false, error: fallbackErr.message });
                        }
                        return res.json({ success: true, users: fallbackUsers });
                    }
                );
                return;
            }
            res.json({ success: true, users });
        }
    );
});

router.get("/comic-access", (req, res) => {
    db.query(`SELECT logs.id, logs.accessed_at, logs.ip_address, logs.watermark_label,
                     users.username, users.email, comics.title
              FROM comic_access_logs logs JOIN users ON users.id = logs.user_id
              JOIN comics ON comics.id = logs.comic_id
              ORDER BY logs.accessed_at DESC LIMIT 200`, (err, logs) => {
        if (err) return res.status(500).json({ success: false, message: "No access history is available yet." });
        return res.json({ success: true, logs });
    });
});

// =============================
// Upload Comic
// =============================

router.get("/orders", (req, res) => {
    db.query(`SELECT orders.id, orders.price, orders.payment_status, orders.purchased_at, users.username, users.email, comics.title, comics.author FROM orders JOIN users ON users.id = orders.user_id JOIN comics ON comics.id = orders.comic_id WHERE orders.payment_status = 'Paid' ORDER BY orders.purchased_at DESC LIMIT 200`, (err, orders) => {
        if (err) return res.status(500).json({ success: false, message: "Could not load orders." });
        return res.json({ success: true, orders });
    });
});
router.get("/orders/:id/invoice", (req, res) => {
    db.query(`SELECT orders.id, orders.price, orders.purchased_at, users.username, users.email, comics.title, comics.author FROM orders JOIN users ON users.id = orders.user_id JOIN comics ON comics.id = orders.comic_id WHERE orders.id = ? AND orders.payment_status = 'Paid' LIMIT 1`, [req.params.id], async (err, orders) => {
        if (err) return res.status(500).json({ success: false, message: "Could not create invoice." });
        if (!orders.length) return res.status(404).json({ success: false, message: "Paid order not found." });
        try { const pdf = await invoicePdf(orders[0]); res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename="keyra-invoice-${orders[0].id}.pdf"`); return res.send(pdf); }
        catch (error) { console.error("Invoice PDF failed:", error.message); return res.status(500).json({ success: false, message: "Could not create invoice." }); }
    });
});

router.post(
    "/comics",
    upload.fields([
        {
            name: "cover_image",
            maxCount: 1
        },
        {
            name: "pdf_file",
            maxCount: 1
        }
    ]),
    async (req, res) => { // <-- ADD async HERE

        console.log("UPLOAD ROUTE REACHED");
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        const {
            title,
            author,
            genre,
            price,
            description
        } = req.body;

        const validationError = validateComicDetails(req.body);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        if (
            !req.files ||
            !req.files.cover_image ||
            !req.files.pdf_file
        ) {
            return res.status(400).json({
                success: false,
                message: "Files are missing"
            });
        }

        let coverImage;
        let pdfFile;

        try {
            coverImage = await uploadCoverToCloudinary(req.files.cover_image[0]);
            pdfFile = await uploadPdfToCloudinary(req.files.pdf_file[0]);
        } catch (error) {
            console.error("Cloud upload failed:", error);
            return res.status(500).json({ success: false, message: "Could not securely store the comic files." });
        }

        db.query(
            `
            INSERT INTO comics
            (title, author, genre, price, cover_image, pdf_file, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                title,
                author,
                genre,
                price,
                coverImage,
                pdfFile,
                description
            ],
            (err, result) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: "Comic uploaded successfully",
                    insertId: result.insertId
                });
            }
        );
    }
);
// =============================
// View Comic PDF (admin only)
// =============================
router.get("/comics/:id/pdf", (req, res) => {
    db.query(
        "SELECT pdf_file FROM comics WHERE id = ?",
        [req.params.id],
        (err, comics) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            if (comics.length === 0) {
                return res.status(404).json({ success: false, message: "Comic not found" });
            }

            res.sendFile(path.join(pdfDir, comics[0].pdf_file));
        }
    );
});

// =============================
// Update Comic
// =============================
router.put(
    "/comics/:id",
    upload.fields([
        { name: "cover_image", maxCount: 1 },
        { name: "pdf_file", maxCount: 1 }
    ]),
    async (req, res) => {
        const { title, author, genre, price, description } = req.body;

        const validationError = validateComicDetails(req.body);
        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        db.query(
            "SELECT cover_image, pdf_file FROM comics WHERE id = ?",
            [req.params.id],
            async (findErr, comics) => {
                if (findErr) {
                    return res.status(500).json({ success: false, error: findErr.message });
                }

                if (comics.length === 0) {
                    return res.status(404).json({ success: false, message: "Comic not found" });
                }

                const existingComic = comics[0];
                let coverImage = existingComic.cover_image;
                let pdfFile = existingComic.pdf_file;

                try {
                    if (req.files?.cover_image?.[0]) {
                        coverImage = await uploadCoverToCloudinary(req.files.cover_image[0]);
                    }
                    if (req.files?.pdf_file?.[0]) {
                        pdfFile = await uploadPdfToCloudinary(req.files.pdf_file[0]);
                    }
                } catch (error) {
                    console.error("Cloud update failed:", error);
                    return res.status(500).json({ success: false, message: "Could not securely store the updated files." });
                }

                db.query(
                    `UPDATE comics
                     SET title = ?, author = ?, genre = ?, price = ?, description = ?, cover_image = ?, pdf_file = ?
                     WHERE id = ?`,
                    [title, author, genre, price, description, coverImage, pdfFile, req.params.id],
                    (updateErr) => {
                        if (updateErr) {
                            return res.status(500).json({ success: false, error: updateErr.message });
                        }

                        // New files were removed from Render after the Cloudinary upload.
                        // Existing local files are retained so older purchases keep working.
                        res.json({ success: true, message: "Comic updated successfully" });
                    }
                );
            }
        );
    }
);

// =============================
// Delete Comic
// =============================
router.delete("/comics/:id", (req, res) => {

    db.query(
        "DELETE FROM comics WHERE id = ?",
        [req.params.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: "Comic deleted successfully"
            });

        }
    );

});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            success: false,
            message: "Each uploaded file must be 20 MB or smaller"
        });
    }

    if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }

    next();
});

module.exports = router;

