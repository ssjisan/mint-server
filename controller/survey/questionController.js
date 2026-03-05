const Question = require("../../model/survey/questionModel.js");
const KPI = require("../../model/survey/kpiModel.js");

// ========================
// Create Question
// ========================
exports.createQuestion = async (req, res) => {
  try {
    const { questionText, type, weight, kpiId } = req.body;

    if (!questionText || !type || !kpiId) {
      return res.status(400).json({
        success: false,
        message: "Question text, type and KPI are required",
      });
    }

    const kpi = await KPI.findById(kpiId);
    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: "KPI not found",
      });
    }

    const question = await Question.create({
      questionText,
      type,
      weight: weight || 1,
      kpiId,
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ========================
// Get All Questions
// ========================
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({})
      .populate("kpiId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ========================
// Update Question
// ========================
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const { questionText, type, weight, kpiId, isActive } = req.body;

    if (kpiId) {
      const kpi = await KPI.findById(kpiId);
      if (!kpi) {
        return res.status(404).json({
          success: false,
          message: "KPI not found",
        });
      }
      question.kpiId = kpiId;
    }

    if (questionText) question.questionText = questionText;
    if (type) question.type = type;
    if (weight !== undefined) question.weight = weight;
    if (typeof isActive === "boolean") question.isActive = isActive;

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ========================
// Delete Question
// ========================
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
