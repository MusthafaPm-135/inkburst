const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ===============================
// REGISTER USER
// ===============================
exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    const normalizedUsername = username?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({ 
            success: false, 
            message: "Enter a valid email address" 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 6 characters" 
        });
    }

    try {
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail],
            async (lookupError, users) => {
                if (lookupError) {
                    return res.status(500).json({ 
                        success: false, 
                        message: "Unable to check the email address" 
                    });
                }

                if (users.length > 0) {
                    return res.status(409).json({ 
                        success: false, 
                        message: "An account with this email already exists" 
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const sql = `
                    INSERT INTO users (username, email, password)
                    VALUES (?, ?, ?)
                `;

                db.query(sql, [normalizedUsername, normalizedEmail, hashedPassword], (err) => {
                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({ 
                                success: false, 
                                message: "An account with this email already exists" 
                            });
                        }

                        console.error("REGISTER ERROR:", err);
                        return res.status(500).json({ 
                            success: false, 
                            message: "Unable to create account" 
                        });
                    }

                    return res.json({
                        success: true,
                        message: "Registration successful"
                    });
                });
            }
        );
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ===============================
// LOGIN USER
// ===============================
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password required"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email.trim().toLowerCase()],
        async (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message || err
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const user = result[0];

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect password"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            // Set cookie with unified cross-origin flags
            res.cookie("token", token, {
                httpOnly: true,
                secure: true,          // Required for Vercel <-> Render HTTPS cross-domain requests
                sameSite: "none",      // Required for cross-domain cookies
                path: "/",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({
                success: true,
                message: "Login successful",
                token, // Returned so frontend can store in localStorage as a backup
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }
    );
};

// ===============================
// LOGOUT
// ===============================
exports.logout = (req, res) => {
    // Options MUST match the flags used in res.cookie
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/"
    });

    return res.json({
        success: true,
        message: "Logged out successfully"
    });
};

// ===============================
// CURRENT USER
// ===============================
exports.me = (req, res) => {
    db.query(
        "SELECT id, username, email, role FROM users WHERE id = ?",
        [req.user.id],
        (err, users) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to load user details"
                });
            }

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            return res.json({
                success: true,
                user: users[0]
            });
        }
    );
};