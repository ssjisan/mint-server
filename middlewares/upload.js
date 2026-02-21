const multer = require("multer");
const path = require("path");
const fs = require("fs");

const BASE_STORAGE =
  process.env.STORAGE_PATH || path.join(process.cwd(), "uploads");

const createUploader = (subFolder = "") => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const finalPath = path.join(BASE_STORAGE, subFolder);

      // ensure folder exists per request
      if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
      }

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
    limits: { fileSize: 2 * 1024 * 1024 },
  });
};

module.exports = createUploader;
