const SurveyResponse = require("../../model/survey/surveyResponseModel");
const SurveyTemplate = require("../../model/survey/surveyTemplateModel");
const Question = require("../../model/survey/questionModel");

exports.submitSurveyResponse = async (req, res) => {
  try {
    const { templateId, customerName, customerId, email, phone, answers } =
      req.body;

    // ======================
    // Basic Validation
    // ======================
    if (!templateId || !customerName || !customerId || !email || !phone) {
      return res.status(400).send({
        success: false,
        message: "All customer fields are required",
      });
    }

    if (!answers || !answers.length) {
      return res.status(400).send({
        success: false,
        message: "Answers are required",
      });
    }

    // ======================
    // Check Template
    // ======================
    const template = await SurveyTemplate.findById(templateId);

    if (!template) {
      return res.status(404).send({
        success: false,
        message: "Survey template not found",
      });
    }

    // ======================
    // Fetch Questions Once (Optimized)
    // ======================
    const questionIds = answers.map((a) => a.questionId);

    const questions = await Question.find({
      _id: { $in: questionIds },
      isActive: true,
    });

    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    // ======================
    // Percentage-Based Score Calculation
    // ======================

    let totalAchievedScore = 0;
    let totalPossibleScore = 0;

    for (const item of answers) {
      const question = questionMap[item.questionId];

      if (!question) continue;

      let numericValue = 0;

      // Rating Question (max = 5)
      if (question.type === "rating") {
        if (typeof item.answer === "number") {
          numericValue = item.answer;
        }
      }

      // Yes/No Question (max = 1)
      if (question.type === "yes_no") {
        if (item.answer === "yes") numericValue = 1;
        if (item.answer === "no") numericValue = 0;
      }

      // Comment ignored

      totalAchievedScore += numericValue * question.weight;

      // Calculate max possible score for this question
      let maxValue = 0;

      if (question.type === "rating") {
        maxValue = 5;
      }

      if (question.type === "yes_no") {
        maxValue = 1;
      }

      totalPossibleScore += maxValue * question.weight;
    }

    // Final Percentage Score
    const averageScore =
      totalPossibleScore > 0
        ? (totalAchievedScore / totalPossibleScore) * 100
        : 0;
    const finalScore = Math.round(averageScore);
    // ======================
    // Category Logic
    // ======================
    let category = "Poor";

    if (averageScore >= 80) {
      category = "Excellent";
    } else if (averageScore >= 60) {
      category = "Good";
    } else if (averageScore >= 40) {
      category = "Average";
    } else if (averageScore >= 20) {
      category = "Poor";
    } else {
      category = "Very Poor";
    }
    // ======================
    // Save Response
    // ======================
    const response = new SurveyResponse({
      templateId,
      customerName,
      customerId,
      email,
      phone,
      answers,
      score: finalScore,
      category,
    });

    await response.save();

    res.status(200).send({
      success: true,
      message: "Survey submitted successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error submitting survey",
    });
  }
};

exports.getSurveyResponses = async (req, res) => {
  try {
    const { templateId, fromDate, toDate } = req.query;

    const filter = {};

    // Template filter
    if (templateId) {
      filter.templateId = templateId;
    }

    // Date filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // Fetch responses
    const responses = await SurveyResponse.find(filter)
      .populate("templateId", "title") // get template title
      .populate("answers.questionId", "questionText") // get question text
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: responses });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching survey responses",
    });
  }
};
