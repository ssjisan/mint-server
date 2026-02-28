const express = require("express");
const router = express.Router();
const { createPreOrder } = require("../controller/preOrderController.js");
const { preOrderLimiter } = require("../middlewares/preOrderLimiter.js");

router.post("/product-pre-order", preOrderLimiter, createPreOrder);

module.exports = router;
