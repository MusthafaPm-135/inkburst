// server.js

require("dotenv").config();
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const db = require("./config/db");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");


// Import routes and middleware
const comicRoutes = require("./routes/comics");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
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
    "/uploads/covers",
    express.static(path.join(__dirname, "uploads/covers"))
);

// Public folder
app.use(
    express.static(path.join(__dirname, "public"))
);


// =======================
// API Routes
// =======================

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/comics", comicRoutes);

app.use("/api/admin", adminRoutes);


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


});

// =======================
// Start Server
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});