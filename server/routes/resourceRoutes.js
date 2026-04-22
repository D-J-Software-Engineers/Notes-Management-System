const express = require("express");
const router = express.Router();
const {
  getAllResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
} = require("../controllers/resourceController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router.get("/", protect, getAllResources);
router.get("/:id", protect, getResource);
router.get("/:id/download", protect, downloadResource);
router.post(
  "/",
  protect,
  authorize("school_admin", "teacher", "admin"),
  upload.single("file"),
  createResource,
);
router.put(
  "/:id",
  protect,
  authorize("school_admin", "teacher", "admin"),
  updateResource,
);
router.delete(
  "/:id",
  protect,
  authorize("school_admin", "teacher", "admin"),
  deleteResource,
);

module.exports = router;
