const Notification = require("../models/Notification");

// @desc  GET /api/notifications — unread (or all recent) for the current student
// @access Private (student)
exports.getNotifications = async (req, res, next) => {
  try {
    const where = {
      userId: req.user.id,
      schoolId: req.user.schoolId,
    };

    // ?unread=true returns only unread; default returns all (last 50)
    if (req.query.unread === "true") {
      where.isRead = false;
    }

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  PUT /api/notifications/:id/read — mark one notification as read
// @access Private
exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc  PUT /api/notifications/read-all — mark all as read for this user
// @access Private
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId: req.user.id,
          schoolId: req.user.schoolId,
          isRead: false,
        },
      },
    );

    res
      .status(200)
      .json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
