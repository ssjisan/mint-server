const multer = require("multer");
const path = require("path");
const fs = require("fs");

const BASE_STORAGE = process.env.STORAGE_PATH || "./uploads";

const createUploader = (subFolder = "") => {
  const finalPath = path.join(BASE_STORAGE, subFolder);

  // ensure folder exists
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, finalPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueName + ext);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  });
};

module.exports = createUploader;
