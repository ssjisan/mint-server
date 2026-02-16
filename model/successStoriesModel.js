// models/Article.js
const mongoose = require("mongoose");

const SuccessStoriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    contentJSON: {
      type: Array,
      required: true,
    },
    contentHTML: {
      type: String,
      required: true,
    },
    coverPhoto: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SuccessStories", SuccessStoriesSchema);
