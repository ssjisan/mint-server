const mongoose = require("mongoose");

const surveyResponseSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SurveyTemplate",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerId: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        answer: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],

    score: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("SurveyResponse", surveyResponseSchema);
