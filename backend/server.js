// server.js

require("dotenv").config();
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const supportRoutes = require("./routes/support");
const couponRoutes = require("./routes/coupons");
const whatsappWebhookRoutes = require("./routes/whatsappWebhook");
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
const { securityHeaders } = require("./middleware/security");

// Create Express app
const app = express();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured before the server can start.");
}

// Render sits behind a proxy; this keeps secure production cookies working.
app.set("trust proxy", 1);


// =======================
// Middleware
// =======================

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);


app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin === "https://keyracomics.vercel.app") return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(securityHeaders);

// WhatsApp signs the exact incoming bytes, so preserve them before parsing JSON.
app.use(
  "/webhooks/whatsapp",
  express.json({
    limit: "100kb",
    verify: (req, res, buffer) => {
      req.rawBody = buffer;
    },
  }),
  whatsappWebhookRoutes
);

app.use(express.json({ limit: "100kb" }));
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

app.use("/api/support", supportRoutes);
app.use("/api/coupons", couponRoutes);

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
