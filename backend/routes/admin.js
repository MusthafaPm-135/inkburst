const express = require("express");
const router = express.Router();

const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

const isRemoteUrl = (value) => /^https?:\/\//i.test(value || "");

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

// =============================
// Upload Comic
// =============================
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
    (req, res) => {

        console.log("UPLOAD ROUTE REACHED");
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        // Read form data FIRST
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
        const pdfFile = req.files.pdf_file[0].filename;

        try {
            coverImage = await uploadCoverToCloudinary(req.files.cover_image[0]);
        } catch (error) {
            return res.status(500).json({ success: false, message: "Could not upload the cover image." });
        }

        console.log("BEFORE INSERT");

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

                console.log("INSIDE CALLBACK");

                if (err) {
                    console.log("INSERT ERROR:", err);

                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                console.log("INSERT SUCCESS:", result);

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
            (findErr, comics) => {
                if (findErr) {
                    return res.status(500).json({ success: false, error: findErr.message });
                }

                if (comics.length === 0) {
                    return res.status(404).json({ success: false, message: "Comic not found" });
                }

                const existingComic = comics[0];
                const coverImage = req.files?.cover_image?.[0]?.filename || existingComic.cover_image;
                const pdfFile = req.files?.pdf_file?.[0]?.filename || existingComic.pdf_file;

                db.query(
                    `UPDATE comics
                     SET title = ?, author = ?, genre = ?, price = ?, description = ?, cover_image = ?, pdf_file = ?
                     WHERE id = ?`,
                    [title, author, genre, price, description, coverImage, pdfFile, req.params.id],
                    (updateErr) => {
                        if (updateErr) {
                            return res.status(500).json({ success: false, error: updateErr.message });
                        }

                        const replacements = [
                            [req.files?.cover_image?.[0], existingComic.cover_image, coverDir],
                            [req.files?.pdf_file?.[0], existingComic.pdf_file, pdfDir]
                        ];

                        replacements.forEach(([newFile, oldFilename, directory]) => {
                            if (newFile && oldFilename) {
                                fs.unlink(path.join(directory, oldFilename), () => {});
                            }
                        });

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
