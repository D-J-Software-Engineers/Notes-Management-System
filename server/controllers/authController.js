const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const { validateLoginSecurity } = require("../utils/securityUtils");

exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      class: classLevel,
      level,
      classStream, // O-Level: e.g. "S1 A"
      stream, // A-Level: "arts" or "science"
      selectedSubjects, // A-Level: array of 3-letter codes
    } = req.body;

    // Force role to be student for public registration
    // Admin accounts should be created via seed script or manually in DB
    const userRole = "student";
    const isConfirmed = false; // Always false for new public registrations

    // Auto-generate combination from selectedSubjects for A-Level
    let combination = null;
    if (
      level === "a-level" &&
      Array.isArray(selectedSubjects) &&
      selectedSubjects.length > 0
    ) {
      combination = selectedSubjects
        .map((c) => c.toUpperCase().trim())
        .join("-");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      class: classLevel,
      level,
      classStream: level === "o-level" ? classStream || null : null,
      stream: level === "a-level" ? stream || null : null,
      combination,
      selectedSubjects: level === "a-level" ? selectedSubjects || null : null,
      isConfirmed,
    });

    const message = isConfirmed
      ? "Registration successful. You can login immediately."
      : "Registration successful. Your account is pending admin approval.";

    const responseData = {
      success: true,
      message,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          level: user.level,
          classStream: user.classStream,
          stream: user.stream,
          combination: user.combination,
          selectedSubjects: user.selectedSubjects,
          isConfirmed: user.isConfirmed,
        },
      },
    };

    if (isConfirmed) {
      responseData.data.token = user.generateAuthToken();
    }

    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Find user first
    const user = await User.findOne({ where: { email } });

    // Use independent security function for tightening login
    // Pass 'role' to ensure students can't login on admin page and vice versa
    await validateLoginSecurity(user, password, role);

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Invalid credentials",
    });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // User is already loaded by protect middleware (req.user is a Sequelize instance)
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(
        new ErrorResponse("Please provide current and new password", 400),
      );
    }

    const user = await User.findByPk(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", 401));
    }

    user.password = newPassword;
    await user.save();

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
