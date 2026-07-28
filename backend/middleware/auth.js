const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

    console.log("HEADERS:", req.headers);
    console.log("COOKIE HEADER:", req.headers.cookie);
    console.log("PARSED COOKIES:", req.cookies);

    const token = req.cookies.token;

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