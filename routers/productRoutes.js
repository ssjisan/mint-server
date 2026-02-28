const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  productDataHandler,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
  getProductsFrontend,
  getSingleProductBySlug,
} = require("../controller/productController.js");

// Memory storage for image uploads
const upload = require("../middlewares/upload.js");

router.post(
  "/product-setup",
  requiredSignIn,
  upload("products").array("productImages", 5),
  (req, res, next) => {
    console.log("After multer:", req.files);
    next();
  },
  productDataHandler,
);
router.get("/products", getAllProducts);
router.get("/products/:id", getSingleProduct);
router.get("/product/:slug", getSingleProductBySlug);
router.delete("/products/:id", requiredSignIn, deleteProduct);
router.get("/all-products", getProductsFrontend);

module.exports = router;
