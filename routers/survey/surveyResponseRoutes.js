const express = require("express");
const router = express.Router();
const {
  submitSurveyResponse,
  getSurveyResponses,
} = require("../../controller/survey/surveyResponseController.js");
const {
  connectionRequestLimiter,
} = require("../../middlewares/connectionRequestLimiter.js");
const { requiredSignIn } = require("../../middlewares/authMiddleware.js");

router.post("/survey-response", submitSurveyResponse);
router.get("/survey-responses-list", requiredSignIn, getSurveyResponses);
module.exports = router;
