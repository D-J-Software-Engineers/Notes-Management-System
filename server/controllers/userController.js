// ============================================
// USER CONTROLLER
// Admin manages student accounts
// ============================================

const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// @desc    Get all users (admin can filter by role)
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      level,
      class: classLevel,
      search,
      limit = 20,
      page = 1,
    } = req.query;

    // Build Sequelize where clause — scoped to the requesting user's school
    const where = { isActive: true, schoolId: req.user.schoolId };

    if (role) where.role = role;
    if (level) where.level = level;
    if (classLevel) where.class = classLevel;

    // Search by name or email
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user (admin creates student)
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      schoolId,
      class: classLevel,
      level,
      combination,
    } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      schoolId: schoolId || req.user.schoolId, // Use provided schoolId or current admin's school
      class: classLevel,
      level,
      combination,
      isConfirmed: req.body.isConfirmed || false,
    });

    // Auto-seed sample content when a school_admin is first created for a school
    if (user.role === "school_admin" && user.schoolId) {
      const {
        seedSampleQuizzes,
        seedSampleNotes,
      } = require("../utils/seedSchoolContent");
      seedSampleQuizzes(user.schoolId, user.id).catch((err) =>
        console.error("Quiz seeding error:", err.message),
      );
      seedSampleNotes(user.schoolId, user.id).catch((err) =>
        console.error("Note seeding error:", err.message),
      );
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      role,
      schoolId,
      class: classLevel,
      level,
      combination,
      isActive,
      isConfirmed,
    } = req.body;

    let user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (schoolId !== undefined) user.schoolId = schoolId;
    if (classLevel) user.class = classLevel;
    if (level) user.level = level;
    if (combination) user.combination = combination;
    if (typeof isActive !== "undefined") user.isActive = isActive;
    if (typeof isConfirmed !== "undefined") user.isConfirmed = isConfirmed;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return next(new ErrorResponse("Cannot delete your own account", 400));
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private (Admin only)
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin only)
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
exports.getUserStats = async (req, res, next) => {
  try {
    // Scope all counts to the current admin's school
    const schoolWhere =
      req.user.role === "super_admin" ? {} : { schoolId: req.user.schoolId };

    const totalUsers = await User.count({ where: schoolWhere });
    const totalStudents = await User.count({
      where: { ...schoolWhere, role: "student" },
    });
    const totalAdmins = await User.count({
      where: { ...schoolWhere, role: "school_admin" },
    });
    const activeUsers = await User.count({
      where: { ...schoolWhere, isActive: true },
    });
    const inactiveUsers = await User.count({
      where: { ...schoolWhere, isActive: false },
    });
    const pendingApproval = await User.count({
      where: { ...schoolWhere, isConfirmed: false },
    });
    const confirmedUsers = await User.count({
      where: { ...schoolWhere, isConfirmed: true },
    });
    const oLevelStudents = await User.count({
      where: { ...schoolWhere, level: "o-level" },
    });
    const aLevelStudents = await User.count({
      where: { ...schoolWhere, level: "a-level" },
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        students: totalStudents,
        admins: totalAdmins,
        active: activeUsers,
        inactive: inactiveUsers,
        pending: pendingApproval,
        confirmed: confirmedUsers,
        byLevel: {
          oLevel: oLevelStudents,
          aLevel: aLevelStudents,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    user.isConfirmed = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User approved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User rejected and deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingUsers = async (req, res, next) => {
  try {
    const where = { isConfirmed: false };
    if (req.user.role !== "super_admin") {
      where.schoolId = req.user.schoolId;
    }
    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
