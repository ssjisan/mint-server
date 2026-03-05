const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../../middlewares/authMiddleware.js");
const {
  createKpi,
  getAllKpis,
  updateKpi,
  deleteKpi,
} = require("../../controller/survey/kpiController.js");

router.post("/create-suvery-kpi", requiredSignIn, createKpi);
router.get("/survey-kpi-list", requiredSignIn, getAllKpis);
router.delete("/survey-kpi/:id", requiredSignIn, deleteKpi);
router.put("/survey-kpi/:id", requiredSignIn, updateKpi);
module.exports = router;
