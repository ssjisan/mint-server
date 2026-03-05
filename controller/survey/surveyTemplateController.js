const SurveyTemplate = require("../../model/survey/surveyTemplateModel.js");

//==================================
// Create Template Controller (Versioned)
//==================================
exports.createSurveyTemplate = async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Find latest version of same title
    const lastTemplate = await SurveyTemplate.findOne({ title }).sort({
      version: -1,
    });

    const newVersion = lastTemplate ? lastTemplate.version + 1 : 1;

    const template = await SurveyTemplate.create({
      title,
      description,
      questions,
      version: newVersion,
      isActive: true,
    });

    // Optional: deactivate old versions
    if (lastTemplate) {
      lastTemplate.isActive = false;
      await lastTemplate.save();
    }

    return res.status(201).json({
      success: true,
      message: "Survey template created successfully",
      data: template,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//==================================
// All Template Survey Controller
//==================================
exports.getAllSurveyTemplates = async (req, res) => {
  try {
    const templates = await SurveyTemplate.find({})
      .populate("questions")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//==================================
// Delete Template Survey Controller
//==================================
exports.deleteSurveyTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SurveyTemplate.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted permanently",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//==================================
// Update Template Survey Controller
//==================================
exports.updateSurveyTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await SurveyTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const { title, description, questions, isActive } = req.body;

    // -----------------------------------
    // VERSION CHANGE ONLY IF QUESTIONS EXIST IN REQUEST
    // -----------------------------------
    let shouldCreateNewVersion = false;

    if (questions) {
      const currentQuestions = template.questions.map(String).sort();
      const newQuestions = [...questions].sort();

      shouldCreateNewVersion =
        JSON.stringify(currentQuestions) !== JSON.stringify(newQuestions);
    }

    // -----------------------------------
    // IF QUESTIONS CHANGED → NEW VERSION
    // -----------------------------------
    if (shouldCreateNewVersion) {
      const lastTemplate = await SurveyTemplate.findOne({
        title: template.title,
      }).sort({ version: -1 });

      const newVersion = lastTemplate ? lastTemplate.version + 1 : 1;

      const newTemplate = await SurveyTemplate.create({
        title: title || template.title,
        description: description || template.description,
        questions,
        version: newVersion,
        isActive: true,
      });

      // Deactivate old version
      template.isActive = false;
      await template.save();

      return res.status(200).json({
        success: true,
        message: "New version created (questions changed)",
        data: newTemplate,
      });
    }

    // -----------------------------------
    // OTHERWISE → NORMAL UPDATE (NO VERSION CHANGE)
    // -----------------------------------
    if (title) template.title = title;
    if (description !== undefined) template.description = description;

    // isActive update DOES NOT affect version
    if (typeof isActive === "boolean") {
      template.isActive = isActive;
    }

    await template.save();

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
