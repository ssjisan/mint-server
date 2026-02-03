const mongoose = require("mongoose");

const requestConnectionSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    packageType: {
      type: String,
      enum: ["residential", "corporate"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "connected", "cancelled", "currently not possible"],
      default: "pending",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  requestConnectionSchema,
);

module.exports = ConnectionRequest;
