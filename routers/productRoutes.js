const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const { productDataHandler } = require("../controller/productController.js");

// Memory storage for image uploads
const upload = require("../middlewares/upload.js");

router.post("/product-setup", requiredSignIn, productDataHandler);

module.exports = router;
