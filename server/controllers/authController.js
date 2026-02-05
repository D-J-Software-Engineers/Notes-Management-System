// ============================================
// AUTHENTICATION CONTROLLER
// Handles user registration, login, logout
// ============================================

const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      class: classLevel,
      level,
      combination,
      stream,
      optionalSubjects,
    } = req.body;

    // Determine if user should be auto-confirmed (admins are auto-confirmed)
    const userRole = role || "student";
    const autoConfirmed = userRole === "admin";

    // Create user (admins are auto-confirmed, students need admin approval)
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      class: classLevel,
      level,
      combination,
      stream,
      optionalSubjects,
      isConfirmed: autoConfirmed, // Admins are auto-confirmed
    });

    // Different message for admins vs students
    const message =
      userRole === "admin"
        ? "Registration successful. You can login immediately."
        : "Registration successful. Awaiting admin approval.";

    res.status(201).json({
      success: true,
      message: message,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          level: user.level,
          combination: user.combination,
          stream: user.stream,
          isConfirmed: user.isConfirmed,
        },
        // Only return token for admins (they can login immediately)
        ...(autoConfirmed && { token: user.generateAuthToken() }),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Find user and verify password
    const user = await User.findByCredentials(email, password);

    // Verify role matches (prevent cross-role access)
    // If role is specified in request, ensure it matches user's actual role
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This account is registered as ${user.role}, not ${role}.`,
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          level: user.level,
          combination: user.combination,
          stream: user.stream,
          isConfirmed: user.isConfirmed,
        },
        token,
      },
    });
  } catch (error) {
    // Custom error for invalid credentials
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  // Note: With JWT, logout is handled client-side by removing token
  // This endpoint is mainly for logging or future session management

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new ErrorResponse("Please provide current and new password", 400),
      );
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};
