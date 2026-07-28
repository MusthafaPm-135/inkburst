const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
    checkout,
    getOrders,
    readComic
} = require("../controllers/orderController");

router.post("/checkout", auth, checkout);

router.get("/", auth, getOrders);

router.get("/read/:comicId", auth, readComic);

module.exports = router;