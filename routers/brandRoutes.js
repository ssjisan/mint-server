const express = require("express");
const router = express.Router();
const multer = require("multer");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  brandDataHandler,
  getAllBrands,
  getBrandById,
  deleteBrandById,
} = require("../controller/brandController.js");

// Memory storage for image uploads
const upload = require("../middlewares/upload.js");

router.post(
  "/brand-handle",
  requiredSignIn,
  upload("brands").single("image"),
  brandDataHandler,
);
router.get("/brands", getAllBrands);
router.get("/brand/:id", requiredSignIn, getBrandById);
router.delete("/brand-delete/:id", requiredSignIn, deleteBrandById);

module.exports = router;
