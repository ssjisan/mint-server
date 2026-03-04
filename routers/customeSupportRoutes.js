const express = require("express");
const router = express.Router();
const {
  getAllSupportRequests,
  createSupportRequest,
  updateSupportStatus,
} = require("../controller/customSupportController.js");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  connectionRequestLimiter,
} = require("../middlewares/connectionRequestLimiter.js");

router.post("/custom-support", connectionRequestLimiter, createSupportRequest);
router.get("/custom-support-list", requiredSignIn, getAllSupportRequests);
router.patch("/support/:id/status", requiredSignIn, updateSupportStatus);

module.exports = router;
