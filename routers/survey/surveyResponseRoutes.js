const express = require("express");
const router = express.Router();
const {
  submitSurveyResponse,
  getSurveyResponses,
  getDashboardOverview,
  getTemplatePerformance,
  getKpiPerformance,
  getQuestionInsights,
} = require("../../controller/survey/surveyResponseController.js");
const {
  connectionRequestLimiter,
} = require("../../middlewares/connectionRequestLimiter.js");
const { requiredSignIn } = require("../../middlewares/authMiddleware.js");

router.post("/survey-response", submitSurveyResponse);
router.get("/survey-responses-list", requiredSignIn, getSurveyResponses);
router.get("/dashboard-overview", requiredSignIn, getDashboardOverview);
router.get(
  "/dashboard-template-pereformance",
  requiredSignIn,
  getTemplatePerformance,
);
router.get("/dashboard-kpi-performance", getKpiPerformance);
router.get("/dashboard-question-insights", getQuestionInsights);
module.exports = router;
