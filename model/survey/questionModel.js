const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["rating", "yes_no", "comment"],
      required: true,
    },

    weight: {
      type: Number,
      default: 1,
    },

    kpiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KPI",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Question", questionSchema);
