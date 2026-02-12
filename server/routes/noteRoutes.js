const express = require("express");
const router = express.Router();
const {
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  downloadNote,
  viewNote,
  getRecentNotes,
  getPopularNotes,
} = require("../controllers/noteController");
const { protect, authorize } = require("../middleware/auth");
const { upload, handleUploadError } = require("../middleware/upload");
const { validateNote } = require("../middleware/validation");

router.get("/recent", protect, getRecentNotes);
router.get("/popular", protect, getPopularNotes);
router.get("/", protect, getAllNotes);
router.get("/:id/view", protect, viewNote);
router.get("/:id/download", protect, downloadNote);
router.get("/:id", protect, getNote);

router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("file"),
  handleUploadError,
  validateNote,
  createNote,
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("file"),
  handleUploadError,
  updateNote,
);

router.delete("/:id", protect, authorize("admin"), deleteNote);

module.exports = router;
