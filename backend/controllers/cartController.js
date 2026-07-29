const db = require("../config/db");

// Add to cart
exports.addToCart = (req, res) => {

    console.log("========== ADD TO CART ==========");
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const userId = req.user.id;
    const { comicId } = req.body;

    db.query("SELECT id FROM cart WHERE user_id = ? AND comic_id = ?", [userId, comicId], (lookupErr, existing) => {
        if (lookupErr) return res.status(500).json({ success: false, message: "Could not update cart" });
        if (existing.length) return res.json({ success: true, message: "Comic is already in your cart" });
        db.query(
            "INSERT INTO cart(user_id, comic_id, quantity) VALUES(?, ?, 1)",
            [userId, comicId],
            (err, result) => {

            console.log("MYSQL ERROR:", err);
            console.log("MYSQL RESULT:", result);

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err
                });
            }

            res.json({
                success: true,
                message: "Comic added to cart"
            });

            }
        );
    });

};

// Get cart
exports.getCart = (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT
            cart.id,
            COALESCE(cart.quantity, 1) AS quantity,
            comics.id AS comic_id,
            comics.title,
            comics.author,
            comics.price,
            comics.cover_image
        FROM cart
        JOIN comics
            ON cart.comic_id = comics.id
        WHERE cart.user_id = ?
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err
            });
        }

        res.json({
            success: true,
            cart: result
        });

    });

};

// Remove item
exports.removeCartItem = (req, res) => {

    db.query(
        "DELETE FROM cart WHERE id=? AND user_id=?",
        [req.params.id, req.user.id],
        (err) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err
                });
            }

            res.json({
                success: true,
                message: "Item removed"
            });

        }
    );

};
