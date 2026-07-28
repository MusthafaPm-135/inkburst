const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "cover") {
            cb(null, "uploads/covers");
        } else if (file.fieldname === "pdf") {
            cb(null, "uploads/pdfs");
        }
    },

    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname)
        );
    }
});

module.exports = multer({ storage });