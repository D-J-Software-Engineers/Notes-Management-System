const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createDiscussion,
  getDiscussions,
  updateStatus,
} = require("../controllers/discussionController");

const router = express.Router();

// Routes for getting and creating
router.get("/", protect, getDiscussions);
router.post("/", protect, createDiscussion);

// Admin exclusive routes
router.put(
  "/:id/status",
  protect,
  authorize("admin", "school_admin", "teacher"),
  updateStatus,
);

module.exports = router;
