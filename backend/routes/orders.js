const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    checkout,
    createPayment,
    verifyPayment,
    getOrders,
    readComic,
    recoverPurchase
} = require("../controllers/orderController");

router.post("/checkout", auth, checkout);
router.post("/create-payment", auth, createPayment);
router.post("/verify-payment", auth, verifyPayment);

router.post("/recover", auth, recoverPurchase);

router.get("/", auth, getOrders);

router.get("/read/:comicId", auth, readComic);

module.exports = router;
