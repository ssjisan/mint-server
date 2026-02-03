const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    // Single speed field (Mbps)
    speedMbps: {
      type: Number,
      required: true,
    },

    // Residential or Corporate
    type: {
      type: String,
      enum: ["residential", "corporate"],
      required: true,
    },

    // Features / benefits list
    items: [
      {
        id: {
          type: String, // or Number if you prefer
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true },
);

const Package = mongoose.model("Package", packageSchema);

module.exports = Package;
