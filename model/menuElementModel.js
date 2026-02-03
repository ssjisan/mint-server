const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Menu", menuSchema);
