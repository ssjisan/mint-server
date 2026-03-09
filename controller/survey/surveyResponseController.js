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

// =======================
// Dashboard Overview
// =======================

exports.getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();

    // Start of Today
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Start of This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // =========================
    // Total Submissions
    // =========================
    const totalSubmissions = await SurveyResponse.countDocuments();

    // =========================
    // Today Submissions
    // =========================
    const todaySubmissions = await SurveyResponse.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // =========================
    // This Month Submissions
    // =========================
    const monthSubmissions = await SurveyResponse.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // =========================
    // Average Score (Overall)
    // =========================
    const avgResult = await SurveyResponse.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$score" },
        },
      },
    ]);

    const averageScore =
      avgResult.length > 0 ? Math.round(avgResult[0].averageScore) : 0;

    // =========================
    // Category Distribution
    // =========================
    const categoryStats = await SurveyResponse.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format category result
    const categories = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      Poor: 0,
      "Very Poor": 0,
    };

    categoryStats.forEach((item) => {
      categories[item._id] = item.count;
    });

    // =========================
    // Send Response
    // =========================
    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        todaySubmissions,
        monthSubmissions,
        averageScore,
        categories,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error loading dashboard overview",
    });
  }
};

exports.getTemplatePerformance = async (req, res) => {
  try {
    const result = await SurveyResponse.aggregate([
      {
        $lookup: {
          from: "surveytemplates", // collection name (IMPORTANT)
          localField: "templateId",
          foreignField: "_id",
          as: "template",
        },
      },
      { $unwind: "$template" },

      {
        $group: {
          _id: "$templateId",
          templateName: { $first: "$template.title" },
          totalSubmissions: { $sum: 1 },
          averageScore: { $avg: "$score" },

          excellent: {
            $sum: {
              $cond: [{ $eq: ["$category", "Excellent"] }, 1, 0],
            },
          },
          good: {
            $sum: {
              $cond: [{ $eq: ["$category", "Good"] }, 1, 0],
            },
          },
          average: {
            $sum: {
              $cond: [{ $eq: ["$category", "Average"] }, 1, 0],
            },
          },
          poor: {
            $sum: {
              $cond: [{ $eq: ["$category", "Poor"] }, 1, 0],
            },
          },
          veryPoor: {
            $sum: {
              $cond: [{ $eq: ["$category", "Very Poor"] }, 1, 0],
            },
          },
        },
      },

      {
        $sort: { totalSubmissions: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching template performance",
    });
  }
};

exports.getKpiPerformance = async (req, res) => {
  try {
    const results = await SurveyResponse.aggregate([
      { $unwind: "$answers" },

      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "question",
        },
      },

      { $unwind: "$question" },

      {
        $match: {
          "question.isActive": true,
        },
      },

      // Convert answer to numeric
      {
        $addFields: {
          numericValue: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$question.type", "rating"] },
                  then: "$answers.answer",
                },
                {
                  case: { $eq: ["$question.type", "yes_no"] },
                  then: {
                    $cond: [{ $eq: ["$answers.answer", "yes"] }, 1, 0],
                  },
                },
              ],
              default: 0,
            },
          },

          maxValue: {
            $switch: {
              branches: [
                { case: { $eq: ["$question.type", "rating"] }, then: 5 },
                { case: { $eq: ["$question.type", "yes_no"] }, then: 1 },
              ],
              default: 0,
            },
          },
        },
      },

      // Group KPI
      {
        $group: {
          _id: "$question.kpiId",

          achievedScore: {
            $sum: {
              $multiply: ["$numericValue", "$question.weight"],
            },
          },

          maxScore: {
            $sum: {
              $multiply: ["$maxValue", "$question.weight"],
            },
          },
        },
      },

      // Calculate percentage
      {
        $project: {
          kpiId: "$_id",
          achievedScore: 1,
          maxScore: 1,
          percentage: {
            $cond: [
              { $gt: ["$maxScore", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$achievedScore", "$maxScore"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },

      // Lookup KPI name
      {
        $lookup: {
          from: "kpis",
          localField: "kpiId",
          foreignField: "_id",
          as: "kpi",
        },
      },

      { $unwind: "$kpi" },

      {
        $project: {
          _id: 0,
          kpiName: "$kpi.name",
          achievedScore: 1,
          maxScore: 1,
          percentage: 1,
        },
      },

      { $sort: { percentage: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching KPI performance",
    });
  }
};

exports.getQuestionInsights = async (req, res) => {
  try {
    const results = await SurveyResponse.aggregate([
      { $unwind: "$answers" },

      {
        $lookup: {
          from: "questions",
          localField: "answers.questionId",
          foreignField: "_id",
          as: "question",
        },
      },

      { $unwind: "$question" },

      {
        $addFields: {
          numericValue: {
            $cond: [
              { $eq: ["$question.type", "yes_no"] },
              { $cond: [{ $eq: ["$answers.answer", "yes"] }, 1, 0] },
              "$answers.answer",
            ],
          },

          maxValue: {
            $cond: [{ $eq: ["$question.type", "yes_no"] }, 1, 5],
          },
        },
      },

      {
        $group: {
          _id: "$question._id",

          question: { $first: "$question.questionText" }, // CHANGE IF FIELD DIFFERENT
          weight: { $first: "$question.weight" },
          kpiId: { $first: "$question.kpiId" },

          responseCount: { $sum: 1 },

          achievedMarks: {
            $sum: { $multiply: ["$numericValue", "$question.weight"] },
          },

          maxMarks: {
            $sum: { $multiply: ["$maxValue", "$question.weight"] },
          },
        },
      },

      {
        $addFields: {
          percentage: {
            $round: [
              {
                $multiply: [{ $divide: ["$achievedMarks", "$maxMarks"] }, 100],
              },
              0,
            ],
          },
        },
      },

      {
        $lookup: {
          from: "kpis",
          localField: "kpiId",
          foreignField: "_id",
          as: "kpi",
        },
      },

      { $unwind: "$kpi" },

      {
        $project: {
          _id: 0,
          question: 1,
          kpiName: "$kpi.name",
          weight: 1,
          responseCount: 1,
          achievedMarks: 1,
          maxMarks: 1,
          percentage: 1,
        },
      },

      { $sort: { percentage: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching question insights",
    });
  }
};
