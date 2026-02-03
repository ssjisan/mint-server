const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: {
      url: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
