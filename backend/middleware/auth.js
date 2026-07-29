const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    console.log("HEADERS:", req.headers);
    console.log("COOKIE HEADER:", req.headers.cookie);
    console.log("PARSED COOKIES:", req.cookies);

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
        console.log("JWT_SECRET:", process.env.JWT_SECRET);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("DECODED TOKEN:", decoded);

        req.user = decoded;

        next();

    } catch (err) {
        console.error("JWT VERIFY ERROR:", err);

        return res.status(401).json({
            success: false,
            message: "Invalid token",
            error: err.message
        });
    }

};