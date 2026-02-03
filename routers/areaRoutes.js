const express = require("express");
const router = express.Router();
const multer = require("multer");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  createOrUpdateArea,
  listAreas,
  deleteArea,
  readArea,
} = require("../controller/areaController.js");

// Memory storage for image uploads
const upload = require("../middlewares/upload.js");

// Create or update area (image is optional)
router.post(
  "/save-area",
  requiredSignIn,
  upload("coverage-area").single("file"),
  createOrUpdateArea
);
router.get("/areas", listAreas);
router.delete("/area/:areaId", requiredSignIn, deleteArea);
router.get("/area/:areaId", readArea);

module.exports = router;
