const express = require("express");
const router = express.Router();
const School = require("../models/School");

// Public route to list schools for registration
router.get("/schools", async (req, res) => {
  try {
    const schools = await School.findAll({
      where: { isActive: true },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
    res.status(200).json({ success: true, data: schools });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
  requestPasswordReset,
  getResetRequests,
  resetUserPassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/password", protect, updatePassword);

// Reset Password Routes
router.post("/request-reset", requestPasswordReset);
router.get("/reset-requests", protect, authorize("admin"), getResetRequests);
router.post("/reset-user/:id", protect, authorize("admin"), resetUserPassword);

module.exports = router;
