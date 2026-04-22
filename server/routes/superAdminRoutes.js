const express = require("express");
const router = express.Router();
const {
  getGlobalStats,
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolRevenue,
  updateSchoolFee,
  generateLicense,
} = require("../controllers/superAdminController");
const { protect, authorize } = require("../middleware/auth");

// All routes here are restricted to Super Admins only
router.use(protect);
router.use(authorize("super_admin"));

router.get("/stats", getGlobalStats);
router.get("/schools", getAllSchools);
router.post("/schools", createSchool);
router.put("/schools/:id", updateSchool);
router.delete("/schools/:id", deleteSchool);
router.get("/schools/:id/revenue", getSchoolRevenue);
router.put("/schools/:id/fee", updateSchoolFee);
router.post("/license", generateLicense);

module.exports = router;
