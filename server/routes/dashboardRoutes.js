const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

router.get(
  "/stats",
  protect,
  authorize("admin", "school_admin", "teacher"),
  getDashboardStats,
);

module.exports = router;
