const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const crypto = require("crypto");

const oauthStates = new Map();
const oauthCodes = new Map();
const query = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => error ? reject(error) : resolve(results));
});
const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const googleRedirectUri = () => `${(process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "")}/api/auth/google/callback`;
const pruneOAuthStore = (store) => {
    const now = Date.now();
    for (const [key, value] of store.entries()) if (value.expiresAt < now) store.delete(key);
};
const publicUser = (user) => ({ id: user.id, username: user.username, email: user.email, role: user.role || "user" });
const createToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role || "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const findOrCreateGoogleUser = async (profile) => {
    const email = profile.email.trim().toLowerCase();
    const existing = await query("SELECT id, username, email, role FROM users WHERE email = ?", [email]);
    if (existing.length) return existing[0];

    const baseName = (profile.name || email.split("@")[0]).replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 40) || "Keyra reader";
    const username = `${baseName.slice(0, 34)} ${crypto.randomBytes(3).toString("hex")}`;
    // Password stays unusable; this account authenticates through Google.
    const password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    const result = await query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, password]);
    const users = await query("SELECT id, username, email, role FROM users WHERE id = ?", [result.insertId]);
    return users[0];
};

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

    if (password.length < 12 || password.length > 64) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be 12 to 64 characters" 
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
                console.error("LOGIN ERROR:", err.message);
                return res.status(500).json({ success: false, message: "Login is temporarily unavailable" });
            }

            if (result.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }

            const user = result[0];

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
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

// ===============================
// GOOGLE SIGN-IN
// ===============================
exports.googleLogin = (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.BACKEND_URL) {
        return res.status(503).json({ success: false, message: "Google sign-in is not configured yet." });
    }
    pruneOAuthStore(oauthStates);
    const state = crypto.randomBytes(32).toString("hex");
    oauthStates.set(state, { expiresAt: Date.now() + 10 * 60 * 1000 });
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: googleRedirectUri(),
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account"
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

exports.googleCallback = async (req, res) => {
    const fail = () => res.redirect(`${frontendUrl()}/login?oauth_error=google`);
    const { code, state } = req.query;
    pruneOAuthStore(oauthStates);
    if (!code || !state || !oauthStates.has(state)) return fail();
    oauthStates.delete(state);

    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: googleRedirectUri(),
                grant_type: "authorization_code"
            })
        });
        const tokens = await tokenResponse.json();
        if (!tokenResponse.ok || !tokens.access_token) throw new Error("Google token exchange failed");

        const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const profile = await profileResponse.json();
        if (!profileResponse.ok || !profile.email || profile.email_verified === false) throw new Error("Google account email is unavailable");

        const user = await findOrCreateGoogleUser(profile);
        pruneOAuthStore(oauthCodes);
        const loginCode = crypto.randomBytes(32).toString("hex");
        oauthCodes.set(loginCode, { token: createToken(user), user: publicUser(user), expiresAt: Date.now() + 60 * 1000 });
        return res.redirect(`${frontendUrl()}/auth/google/callback?code=${loginCode}`);
    } catch (error) {
        console.error("Google sign-in failed:", error);
        return fail();
    }
};

exports.exchangeGoogleCode = (req, res) => {
    const { code } = req.body || {};
    pruneOAuthStore(oauthCodes);
    const login = oauthCodes.get(code);
    if (!login) return res.status(400).json({ success: false, message: "This Google sign-in link has expired. Please try again." });
    oauthCodes.delete(code);
    return res.json({ success: true, token: login.token, user: login.user });
};
