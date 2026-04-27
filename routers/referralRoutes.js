const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  createOrGetReferralUser,
  getAllReferralUsers,
} = require("../controller/referralController.js");

router.post("/referral-setup", createOrGetReferralUser);
router.get("/referral", requiredSignIn, getAllReferralUsers);

module.exports = router;
