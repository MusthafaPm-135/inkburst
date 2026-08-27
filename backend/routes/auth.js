const express = require("express");
const router = express.Router();

const {
    register,
    login,
    logout,
    me,
    tawkIdentity,
    googleLogin,
    googleCallback,
    exchangeGoogleCode
} = require("../controllers/authController");
const auth = require("../middleware/auth");
const { rateLimit } = require("../middleware/security");
const authRateLimit = rateLimit({ prefix: "auth", limit: 10, windowMs: 15 * 60 * 1000 });


// Register Route
router.post("/register", authRateLimit, register);


// Login Route
router.post("/login", authRateLimit, login);

router.get("/google", authRateLimit, googleLogin);
router.get("/google/callback", googleCallback);
router.post("/google/exchange", exchangeGoogleCode);


//Logout Route
router.post("/logout", logout);

router.get("/me", auth, me);
router.get("/tawk-identity", auth, tawkIdentity);


module.exports = router;
