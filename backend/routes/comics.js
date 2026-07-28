const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
    uploadComic,
    getComics
} = require("../controllers/comicController");

router.get("/", getComics);

router.post(
    "/upload",
    upload.fields([
        { name: "cover", maxCount: 1 },
        { name: "pdf", maxCount: 1 }
    ]),
    uploadComic
);

module.exports = router;