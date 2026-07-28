const db = require("../config/db");
const path = require("path");

console.log("✅ USING orderController.js - UPDATED VERSION");

// ==========================================
// CHECKOUT
// ==========================================
exports.checkout = (req, res) => {

    console.log("========== CHECKOUT ==========");

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
         AND orders.comic_id = ?`,
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
