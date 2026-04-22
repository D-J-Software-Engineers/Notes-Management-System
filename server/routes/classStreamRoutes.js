const express = require("express");
const router = express.Router();
const {
  getAllStreams,
  createStream,
  updateStream,
  deleteStream,
} = require("../controllers/classStreamController");
const { protect, authorize } = require("../middleware/auth");

// GET all streams — public (needed for registration page without login)
router.get("/", getAllStreams);

// POST create stream (admin only)
router.post(
  "/",
  protect,
  authorize("school_admin", "teacher", "admin"),
  createStream,
);

// PUT update / DELETE remove specific stream (admin only)
router
  .route("/:id")
  .put(protect, authorize("school_admin", "teacher", "admin"), updateStream)
  .delete(protect, authorize("school_admin", "teacher", "admin"), deleteStream);

module.exports = router;
