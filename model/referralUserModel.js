const mongoose = require("mongoose");

const referralUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    referralId: {
      type: String,
      required: true,
      unique: true,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    successfulConnections: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const ReferralUser = mongoose.model("ReferralUser", referralUserSchema);

module.exports = ReferralUser;
