const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
  updateCategory,
} = require("../controller/categoryController.js");

router.post("/create-category", requiredSignIn, createCategory);
router.get("/categories", getAllCategories);
router.get("/category/:id", requiredSignIn, getCategoryById);
router.delete("/category-delete/:id", requiredSignIn, deleteCategory);
router.put("/category/:id", requiredSignIn, updateCategory);

module.exports = router;
