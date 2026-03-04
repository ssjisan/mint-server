const express = require("express");
const router = express.Router();
const {
  createPreOrder,
  getAllPreOrders,
  updatePreOrderStatus,
} = require("../controller/preOrderController.js");
const { preOrderLimiter } = require("../middlewares/preOrderLimiter.js");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");

router.post("/product-pre-order", preOrderLimiter, createPreOrder);
router.get("/pre-orders", requiredSignIn, getAllPreOrders);
router.patch("/pre-orders/:id/status", requiredSignIn, updatePreOrderStatus);
module.exports = router;
