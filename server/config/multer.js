// middleware/multer.js

const multer = require("multer");
const storage = multer.memoryStorage(); // For S3
const upload = multer({ storage });
module.exports = upload;

