const express = require("express");
const db = require("../config/db");
const upload = require("../config/multer");

const router = express.Router();

/*
    POST /api/comics
    Add a new comic
*/
router.post("/", upload.single("cover"), (req, res) => {

    const coverImage = req.file ? req.file.filename : null;

    const {
        title,
        description,
        author,
        price,
        is_premium
    } = req.body;

    if (!title || !author) {
        return res.status(400).json({
            success: false,
            message: "Title and author are required"
        });
    }

    const sql = `
        INSERT INTO comics
        (title, description, author, cover_image, price, is_premium)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            description,
            author,
            coverImage,
            price || 0,
            is_premium || false
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.sqlMessage
                });
            }

            res.status(201).json({
                success: true,
                message: "Comic added successfully",
                comicId: result.insertId,
                cover: coverImage
            });

        }
    );

});


/*
    GET /api/comics
    Get all comics
*/
router.get("/", (req, res) => {

    const sql = "SELECT * FROM comics ORDER BY id DESC";

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.sqlMessage
            });
        }

        res.json({
            success: true,
            comics: results
        });

    });

});


/*
    GET /api/comics/:id
    Get one comic
*/
router.get("/:id", (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT * FROM comics WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.sqlMessage
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Comic not found"
                });
            }

            res.json({
                success: true,
                comic: results[0]
            });

        }
    );

});


/*
    DELETE /api/comics/:id
    Delete a comic
*/
router.delete("/:id", (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM comics WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.sqlMessage
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Comic not found"
                });
            }

            res.json({
                success: true,
                message: "Comic deleted successfully"
            });

        }
    );

});

module.exports = router;