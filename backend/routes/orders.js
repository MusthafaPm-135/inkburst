const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    checkout,
    createPayment,
    verifyPayment,
    getOrders,
    readComic
} = require("../controllers/orderController");

router.post("/checkout", auth, checkout);
router.post("/create-payment", auth, createPayment);
router.post("/verify-payment", auth, verifyPayment);

router.get("/", auth, getOrders);

router.get("/read/:comicId", auth, readComic);

module.exports = router;
