const db = require("../config/db");

// =======================
// Add to Cart
// =======================
exports.addToCart = (req, res) => {

    const userId = req.user.id;
    const { comic_id } = req.body;

    if (!comic_id) {
        return res.status(400).json({
            success: false,
            message: "Comic ID is required"
        });
    }

    db.query(
        "SELECT * FROM cart WHERE user_id=? AND comic_id=?",
        [userId, comic_id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.length > 0) {

                return res.json({
                    success: true,
                    message: "Already in cart"
                });

            }

            db.query(
                "INSERT INTO cart(user_id,comic_id) VALUES(?,?)",
                [userId, comic_id],
                (err2) => {

                    if (err2) {
                        return res.status(500).json(err2);
                    }

                    res.json({
                        success: true,
                        message: "Added to cart"
                    });

                }
            );

        }
    );

};

// =======================
// Get Cart
// =======================
exports.getCart = (req, res) => {

    const userId = req.user.id;

    db.query(
        `
        SELECT
        cart.id,
        comics.id AS comic_id,
        comics.title,
        comics.author,
        comics.price,
        comics.cover_image

        FROM cart

        JOIN comics
        ON comics.id = cart.comic_id

        WHERE cart.user_id=?
        `,
        [userId],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);

        }
    );

};

// =======================
// Remove Item
// =======================
exports.removeCartItem = (req, res) => {

    const userId = req.user.id;
    const cartId = req.params.id;

    db.query(
        "DELETE FROM cart WHERE id=? AND user_id=?",
        [cartId, userId],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                message: "Removed"
            });

        }
    );

};