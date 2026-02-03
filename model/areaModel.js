const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema(
  {
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coverPhoto: {
      url: {
        type: String,
        required: false,
      },
    },
    polygons: [
      {
        coordinates: {
          type: [[Number]], // Array of [lat, lng]
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Area", areaSchema);
