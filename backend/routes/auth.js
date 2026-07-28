const express = require("express");
const router = express.Router();

const {
    register,
    login,
    logout,
    me
} = require("../controllers/authController");
const auth = require("../middleware/auth");


// Register Route
router.post("/register", register);


// Login Route
router.post("/login", login);


//Logout Route
router.post("/logout", logout);

router.get("/me", auth, me);


module.exports = router;
