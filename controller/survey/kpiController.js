const KPI = require("../../model/survey/kpiModel.js");
const KpiCategory = require("../../model/survey/kpiCategoryModel.js");
const slugify = require("slugify");

// ========================
// Create KPI Controller
// ========================
exports.createKpi = async (req, res) => {
  try {
    const { name, tag, description, categoryId } = req.body;

    if (!name || !tag || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, tag and category are required",
      });
    }

    // Check if category exists
    const category = await KpiCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Create slug-style tag
    const finalTag = slugify(tag, {
      lower: true,
      strict: true,
    });

    // Check duplicate tag
    const existing = await KPI.findOne({ tag: finalTag });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "KPI tag already exists",
      });
    }

    const kpi = await KPI.create({
      name,
      tag: finalTag,
      description,
      categoryId,
    });

    return res.status(201).json({
      success: true,
      message: "KPI created successfully",
      data: kpi,
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
// Get All KPI Controller
// ========================
exports.getAllKpis = async (req, res) => {
  try {
    const kpis = await KPI.find({})
      .populate("categoryId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: kpis,
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
// Update KPI Controller
// ========================
exports.updateKpi = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tag, description, categoryId, isActive } = req.body;

    const kpi = await KPI.findById(id);

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: "KPI not found",
      });
    }

    if (categoryId) {
      const category = await KpiCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      kpi.categoryId = categoryId;
    }

    if (tag) {
      const finalTag = slugify(tag, { lower: true, strict: true });

      const existing = await KPI.findOne({
        tag: finalTag,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Tag already exists",
        });
      }

      kpi.tag = finalTag;
    }

    if (name) kpi.name = name;
    if (description !== undefined) kpi.description = description;
    if (typeof isActive === "boolean") kpi.isActive = isActive;

    await kpi.save();

    return res.status(200).json({
      success: true,
      message: "KPI updated successfully",
      data: kpi,
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
// Delete KPI Controller
// ========================
exports.deleteKpi = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await KPI.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "KPI not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "KPI deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
