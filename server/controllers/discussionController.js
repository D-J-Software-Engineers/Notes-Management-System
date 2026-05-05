const Discussion = require("../models/Discussion");
const User = require("../models/User");
const Subject = require("../models/Subject");

// Create a new discussion
exports.createDiscussion = async (req, res, next) => {
  try {
    // Only Admin, School Admin and Teacher can create discussions
    if (
      !["admin", "super_admin", "school_admin", "teacher"].includes(
        req.user.role,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Only Admins and Teachers can create discussions/meetings.",
      });
    }

    const {
      title,
      description,
      meetingLink,
      class: studentClass,
      level,
      subjectId,
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Please link the discussion to a subject.",
      });
    }

    const discussion = await Discussion.create({
      title,
      description,
      meetingLink,
      class: studentClass,
      level,
      subjectId,
      status: ["admin", "super_admin", "school_admin"].includes(req.user.role)
        ? "approved"
        : "pending",
      createdById: req.user.id,
      schoolId: req.user.schoolId,
    });

    res.status(201).json({
      success: true,
      data: discussion,
      message: ["admin", "super_admin", "school_admin"].includes(req.user.role)
        ? "Discussion created successfully."
        : "Discussion proposed successfully. It is pending admin approval.",
    });
  } catch (error) {
    next(error);
  }
};

// Get discussions (Admin sees all, Student sees approved for their level + class)
exports.getDiscussions = async (req, res, next) => {
  try {
    const { level, class: studentClass, subjectId } = req.query;

    let whereClause = { schoolId: req.user.schoolId };

    // If user is not admin/teacher, apply student restrictions
    if (req.user.role === "student") {
      whereClause.status = "approved";
      // Normalize to lowercase to avoid casing mismatches with enum values
      if (level) {
        whereClause.level = level.toLowerCase();
      }
      if (studentClass) {
        whereClause.class = studentClass.toLowerCase();
      }
    }

    if (subjectId) {
      whereClause.subjectId = subjectId;
    }

    const discussions = await Discussion.findAll({
      where: whereClause,
      include: [
        { model: User, as: "createdBy", attributes: ["id", "name", "role"] },
        { model: Subject, as: "subject", attributes: ["name", "code"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res
      .status(200)
      .json({ success: true, count: discussions.length, data: discussions });
  } catch (error) {
    next(error);
  }
};

// Update discussion status (Admin only)
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const discussion = await Discussion.findByPk(id);
    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    discussion.status = status;
    await discussion.save();

    res.status(200).json({
      success: true,
      data: discussion,
      message: `Discussion status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
