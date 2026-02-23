const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  productDataHandler,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
} = require("../controller/productController.js");

// Memory storage for image uploads
const upload = require("../middlewares/upload.js");

router.post(
  "/product-setup",
  requiredSignIn,
  upload("products").array("productImages", 5),
  productDataHandler,
);
router.get("/products", getAllProducts);
router.get("/products/:id", getSingleProduct);
router.delete("/products/:id", requiredSignIn, deleteProduct);
module.exports = router;
