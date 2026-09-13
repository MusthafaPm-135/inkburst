const jwt = require("jsonwebtoken");
const db = require('../config/db');

module.exports = (req, res, next) => {

    // 1. Check for the token in the Authorization header first (Bearer <token>)
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(" ")[1];

    // 2. Fall back to the cookie if the header isn't present
    const token = headerToken || req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        db.query('SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1', [decoded.id], (error, users) => {
            if (error) return res.status(503).json({success:false,message:'Could not verify your account. Please retry.'});
            if (!users.length) return res.status(401).json({success:false,message:'This account is no longer available.'});
            req.user = {...decoded, ...users[0]};
            next();
        });

    } catch (err) {
        console.error("JWT VERIFY ERROR:", err);

        return res.status(401).json({
            success: false,
            message: "Invalid token",
            error: err.message
        });
    }

};
