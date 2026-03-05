const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../../middlewares/authMiddleware.js");
const {
  createKpiCategory,
  getAllKpiCategories,
  deleteKpiCategory,
  updateKpiCategory,
} = require("../../controller/survey/kpiCategoryController.js");

router.post("/create-kpi-category", requiredSignIn, createKpiCategory);
router.get("/kpi-category-list", requiredSignIn, getAllKpiCategories);
router.delete("/kpi-category/:id", requiredSignIn, deleteKpiCategory);
router.put("/kpi-category/:id", requiredSignIn, updateKpiCategory);
module.exports = router;
