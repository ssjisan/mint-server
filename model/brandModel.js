const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: {
      url: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Brand", brandSchema);
