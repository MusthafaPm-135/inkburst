const db = require("../config/db");

// ==========================
// UPLOAD COMIC
// ==========================
exports.uploadComic = (req, res) => {

    console.log("========== UPLOAD DEBUG ==========");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("==================================");

    if (!req.files) {
        return res.status(400).json({
            success: false,
            message: "No files received."
        });
    }

    const {
        title,
        author,
        genre,
        price,
        description
    } = req.body;

    const cover_image =
        req.files.cover && req.files.cover.length > 0
            ? req.files.cover[0].filename
            : null;

    const pdf_file =
        req.files.pdf && req.files.pdf.length > 0
            ? req.files.pdf[0].filename
            : null;

    if (!title || !author || !price || !cover_image || !pdf_file) {
        return res.status(400).json({
            success: false,
            message: "Title, author, price, cover and PDF are required."
        });
    }

    const sql = `
        INSERT INTO comics
        (title, author, genre, price, cover_image, pdf_file, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            author,
            genre || null,
            price,
            cover_image,
            pdf_file,
            description || null
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            res.json({
                success: true,
                message: "Comic uploaded successfully!",
                comicId: result.insertId
            });

        }
    );

};


// ==========================
// GET ALL COMICS
// ==========================
exports.getComics = (req, res) => {

    db.query(
        "SELECT * FROM comics ORDER BY created_at DESC",
        (err, result) => {

            if (err) {

                console.log("COMICS DATABASE ERROR:", err);

                return res.status(500).json({
                    success:false,
                    message:"Database error",
                    error: err.message
                });
            }

            res.json({
                success:true,
                comics:result
            });

        }
    );

};