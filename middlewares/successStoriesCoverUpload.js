const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Use STORAGE_PATH from .env
const BASE_STORAGE =
  process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");

const coverPath = path.join(BASE_STORAGE, "success-stories", "cover-photos");

// Ensure folder exists
if (!fs.existsSync(coverPath)) {
  fs.mkdirSync(coverPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coverPath);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      "successStories-" +
      Date.now() +
      "-" +
      file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  },
});

module.exports = multer({ storage });
