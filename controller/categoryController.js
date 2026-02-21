const Category = require("../model/categoryModel.js");
const slugify = require("slugify");

/**
 * CREATE CATEGORY
 */
const createCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Prevent duplicate
    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const category = await Category.create({
      name,
      slug: slugify(name, { lower: true }),
      isActive: isActive ?? true,
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error("Create category failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET ALL CATEGORIES
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Fetch categories failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET CATEGORY BY ID
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json(category);
  } catch (error) {
    console.error("Fetch category failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * UPDATE CATEGORY
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true });
    }

    if (typeof isActive === "boolean") {
      category.isActive = isActive;
    }

    await category.save();

    return res.status(200).json(category);
  } catch (error) {
    console.error("Update category failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * DELETE CATEGORY
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category failed:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
