const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../../middlewares/authMiddleware.js");
const {
  createSurveyTemplate,
  getAllSurveyTemplates,
  deleteSurveyTemplate,
  updateSurveyTemplate,
} = require("../../controller/survey/surveyTemplateController.js");

router.post("/create-suvery-template", requiredSignIn, createSurveyTemplate);
router.get("/survey-template-list", requiredSignIn, getAllSurveyTemplates);
router.delete("/survey-template/:id", requiredSignIn, deleteSurveyTemplate);
router.put("/survey-template/:id", requiredSignIn, updateSurveyTemplate);
module.exports = router;
