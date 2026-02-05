const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validation");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/password", protect, updatePassword);

module.exports = router;
