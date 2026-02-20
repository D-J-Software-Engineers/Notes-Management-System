const express = require("express");
const router = express.Router();
const {
  getAllSubjects,
  getSubjectsByLevel,
  getCombinations,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, authorize } = require("../middleware/auth");

// List & filter subjects - PUBLIC (needed for registration)
router.get("/", getAllSubjects);

// Level-based listing - PUBLIC
router.get("/level/:level", getSubjectsByLevel);

// A-Level combinations metadata - PUBLIC
router.get("/combinations", getCombinations);

// Admin protected routes
router.post("/", protect, authorize("admin"), createSubject);
router
  .route("/:id")
  .put(protect, authorize("admin"), updateSubject)
  .delete(protect, authorize("admin"), deleteSubject);

module.exports = router;
