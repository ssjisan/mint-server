const KpiCategory = require("../../model/survey/kpiCategoryModel.js");
const slugify = require("slugify");

//===========================
// Create Category Controller
//===========================
exports.createKpiCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // If slug is not provided, generate from name
    const finalSlug = slug
      ? slugify(slug, { lower: true, strict: true })
      : slugify(name, { lower: true, strict: true });

    // Check duplicate slug
    const existing = await KpiCategory.findOne({
      slug: finalSlug,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category slug already exists",
      });
    }

    const category = await KpiCategory.create({
      name,
      slug: finalSlug,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "KPI Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//===========================
// Category List Controller
//===========================
exports.getAllKpiCategories = async (req, res) => {
  try {
    const categories = await KpiCategory.find({});

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//===========================
// Category List Delete Controller
//===========================
exports.deleteKpiCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await KpiCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Hard delete
    await KpiCategory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
//===========================
// Update Category Controller
//===========================
exports.updateKpiCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, isActive } = req.body;

    const category = await KpiCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // 🔹 Determine new slug
    let finalSlug = category.slug;

    if (slug) {
      finalSlug = slugify(slug, { lower: true, strict: true });
    } else if (name) {
      finalSlug = slugify(name, { lower: true, strict: true });
    }

    // 🔹 Check duplicate (exclude current record)
    const existing = await KpiCategory.findOne({
      slug: finalSlug,
      _id: { $ne: id },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    // 🔹 Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;

    category.slug = finalSlug;

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
