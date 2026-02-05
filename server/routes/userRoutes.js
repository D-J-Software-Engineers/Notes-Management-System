// userRoutes.js
const express = require("express");
const userRouter = express.Router();

const {
  getProfile,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateProfile,
} = require("../controllers/userController");

const { register, login } = require("../controllers/authController");

const { protect, authorize } = require("../middleware/auth");

// Public routes (reuse auth controller handlers)
userRouter.post("/register", register);
userRouter.post("/login", login);

// Protected routes
userRouter.use(protect); // All routes below require authentication

userRouter.get("/profile", getProfile);
userRouter.put("/profile", updateProfile);

// Admin only routes
userRouter.use(authorize("admin"));

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUser);
userRouter.put("/:id", updateUser);
userRouter.delete("/:id", deleteUser);

module.exports = userRouter;
