// server.js

const cartRoutes = require("./routes/cart");
const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");

// Load environment variables
dotenv.config();

// Import routes and middleware
const comicRoutes = require("./routes/comics");
const authRoutes = require("./routes/auth");
const auth = require("./middleware/auth");

// Create Express app
const app = express();


// =======================
// Middleware
// =======================

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


// =======================
// Static folders
// =======================

// Uploaded comic images/files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Public folder
app.use(
    express.static(path.join(__dirname, "public"))
);


// =======================
// API Routes
// =======================

app.use("/api/cart", cartRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/comics", comicRoutes);


// =======================
// Test Route
// =======================

app.get("/", (req, res) => {
    res.send("Backend is running...");
});


// =======================
// Protected Profile Route
// =======================

app.get("/api/profile", auth, (req, res) => {

    db.query(
        "SELECT id, username, email, role FROM users WHERE id = ?",
        [req.user.id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            res.json({
                success: true,
                user: result[0]
            });

        }
    );

});

// =======================
// Start Server
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});