const db = require("../config/db");

// Add to cart
exports.addToCart = (req, res) => {

    console.log("========== ADD TO CART ==========");
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const userId = req.user.id;
    const { comicId } = req.body;

    if (!Number.isInteger(Number(comicId))) {
        return res.status(400).json({ success: false, message: "Choose a valid comic." });
    }

    db.query(`SELECT id FROM cart WHERE user_id = ? AND comic_id = ?
              UNION ALL
              SELECT id FROM orders WHERE user_id = ? AND comic_id = ? AND payment_status = 'Paid'`, [userId, comicId, userId, comicId], (lookupErr, existing) => {
        if (lookupErr) return res.status(500).json({ success: false, message: "Could not update cart" });
        if (existing.length) return res.json({ success: true, message: "This comic is already in your cart or library" });
        db.query(
            "INSERT INTO cart(user_id, comic_id) VALUES(?, ?)",
            [userId, comicId],
            (err, result) => {

            console.log("MYSQL ERROR:", err);
            console.log("MYSQL RESULT:", result);

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Could not add this comic to your cart.",
                    error: err.message
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
            1 AS quantity,
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
