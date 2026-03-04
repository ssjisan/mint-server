const mongoose = require("mongoose");

const customSupportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    officeName: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    serviceName: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10, // at least some characters
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomSupport", customSupportSchema);
