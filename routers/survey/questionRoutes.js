const express = require("express");
const router = express.Router();
const { requiredSignIn } = require("../../middlewares/authMiddleware.js");
const {
  createQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
} = require("../../controller/survey/questionController.js");

router.post("/create-suvery-question", requiredSignIn, createQuestion);
router.get("/survey-question-list", requiredSignIn, getAllQuestions);
router.delete("/survey-question/:id", requiredSignIn, deleteQuestion);
router.put("/survey-question/:id", requiredSignIn, updateQuestion);
module.exports = router;
