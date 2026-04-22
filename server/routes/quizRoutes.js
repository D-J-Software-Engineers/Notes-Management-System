const express = require("express");
const router = express.Router();
const {
  getAllQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  downloadQuiz,
  viewQuiz,
} = require("../controllers/quizController");
const { protect, authorize } = require("../middleware/auth");
const { upload, handleUploadError } = require("../middleware/upload");

router.get("/", protect, getAllQuizzes);
router.get("/:id/view", protect, viewQuiz);
router.get("/:id/download", protect, downloadQuiz);
router.get("/:id", protect, getQuiz);

router.post(
  "/",
  protect,
  authorize("school_admin", "teacher", "admin"),
  upload.single("file"),
  handleUploadError,
  createQuiz,
);

router.put(
  "/:id",
  protect,
  authorize("school_admin", "teacher", "admin"),
  upload.single("file"),
  handleUploadError,
  updateQuiz,
);

router.delete(
  "/:id",
  protect,
  authorize("school_admin", "teacher", "admin"),
  deleteQuiz,
);

module.exports = router;
