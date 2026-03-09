const express = require("express");
const router = express.Router();
const {
  createConnectionRequest,
  getAllConnectionRequests,
  updateConnectionRequestStatus,
  getConnectionRequestStats,
  getRecentPendingRequests,
} = require("../controller/requestConnectionController.js");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  connectionRequestLimiter,
} = require("../middlewares/connectionRequestLimiter.js");

router.post(
  "/connection-request",
  connectionRequestLimiter,
  createConnectionRequest,
);
router.get("/connection-requests", requiredSignIn, getAllConnectionRequests);
router.get("/latest-connection-requests", getRecentPendingRequests);
router.put(
  "/connection-request/:id/status",
  requiredSignIn,
  updateConnectionRequestStatus,
);
router.get("/connection-status", requiredSignIn, getConnectionRequestStats);

module.exports = router;
