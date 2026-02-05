const express = require("express");
const router = express.Router();

const {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const { protect, authorize } = require("../middleware/auth");

// All subject routes require authentication
router.use(protect);

// List subjects (students and admin)
router.get("/", getSubjects);
router.get("/:id", getSubject);

// Admin-only management routes
router.use(authorize("admin"));

router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;
