// routes/articleRoutes.js
const express = require("express");
const router = express.Router();
const {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
} = require("../controller/SuccessStoriesController.js");
const { requiredSignIn } = require("../middlewares/authMiddleware.js");
const newsCoverUpload = require("../middlewares/successStoriesCoverUpload.js");

router.post(
  "/create-news",
  newsCoverUpload.single("coverPhoto"),
  requiredSignIn,
  createNews,
);
router.get("/all-news", getAllNews);
router.get("/news/:id", getNewsById);
router.put(
  "/update-news/:id",
  newsCoverUpload.single("coverPhoto"),
  requiredSignIn,
  updateNews,
);
router.delete("/delete-news/:id", deleteNews);

module.exports = router;
