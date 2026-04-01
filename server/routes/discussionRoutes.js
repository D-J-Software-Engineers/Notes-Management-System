const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createDiscussion,
  getDiscussions,
  updateStatus,
  addPublication,
} = require("../controllers/discussionController");

const router = express.Router();

// Routes for getting and creating
router.get("/", protect, getDiscussions);
router.post("/", protect, createDiscussion);
router.put("/:id/publication", protect, addPublication);

// Admin exclusive routes
router.put("/:id/status", protect, authorize("admin"), updateStatus);

module.exports = router;
