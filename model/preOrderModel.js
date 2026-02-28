const mongoose = require("mongoose");

const preOrderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    productSnapshot: {
      name: String,
      price: Number,
      discount: {
        type: {
          type: String,
          enum: ["none", "percentage", "fixed"],
        },
        value: Number,
      },
    },

    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true, index: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    finalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    ipAddress: { type: String },
    notes: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("PreOrder", preOrderSchema);
