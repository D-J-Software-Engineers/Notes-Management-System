const Discussion = require("../models/Discussion");
const User = require("../models/User");

// Create a new discussion
exports.createDiscussion = async (req, res, next) => {
  try {
    const {
      title,
      description,
      meetingLink,
      class: studentClass,
      level,
    } = req.body;

    const discussion = await Discussion.create({
      title,
      description,
      meetingLink,
      class: studentClass,
      level,
      status: "pending",
      createdById: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: discussion,
      message:
        "Discussion proposed successfully. It is pending admin approval.",
    });
  } catch (error) {
    next(error);
  }
};

// Get discussions (Admin sees all, Student sees approved for their level + class)
exports.getDiscussions = async (req, res, next) => {
  try {
    const { level, class: studentClass } = req.query;

    let whereClause = {};

    // If user is not admin, apply student restrictions
    if (req.user.role !== "admin") {
      whereClause.status = "approved";
      // Normalize to lowercase to avoid casing mismatches with enum values
      if (level) {
        whereClause.level = level.toLowerCase();
      }
      if (studentClass) {
        whereClause.class = studentClass.toLowerCase();
      }
    }

    const discussions = await Discussion.findAll({
      where: whereClause,
      include: [
        { model: User, as: "createdBy", attributes: ["id", "name", "email"] },
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

// Add publication to a discussion (Students)
exports.addPublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publicationText } = req.body;

    const discussion = await Discussion.findByPk(id);
    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    // Optionally strictly ensure that only the creator can add a publication
    if (discussion.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can add publications",
      });
    }

    discussion.publicationText = publicationText;
    // We could set status = 'pending' if it needs admin re-approval
    // Wait, the publication is inside the discussion. Setting it to pending hides the whole discussion.
    // We'll trust the user, or let the admin see the text since it's just a seminar summary.
    // Changing status to "pending" is reasonable based on instructions. Keep the status as it is but allow admin to edit or reject it.

    await discussion.save();

    res.status(200).json({
      success: true,
      data: discussion,
      message: "Publication added successfully.",
    });
  } catch (error) {
    next(error);
  }
};
