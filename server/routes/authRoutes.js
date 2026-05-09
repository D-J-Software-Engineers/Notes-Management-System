const express = require("express");
const router = express.Router();
const School = require("../models/School");

// Public route to list schools for registration removed for security
const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
  requestPasswordReset,
  getResetRequests,
  resetUserPassword,
  getRegistrationData,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/registration-data", getRegistrationData);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/password", protect, updatePassword);

// Reset Password Routes
router.post("/request-reset", requestPasswordReset);
router.get(
  "/reset-requests",
  protect,
  authorize("super_admin", "admin"),
  getResetRequests,
);
router.post(
  "/reset-user/:id",
  protect,
  authorize("super_admin", "admin"),
  resetUserPassword,
);

module.exports = router;
