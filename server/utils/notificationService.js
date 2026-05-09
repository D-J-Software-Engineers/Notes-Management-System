/**
 * Notification Service
 * Creates Notification records for all students eligible to see a piece of content.
 * Called fire-and-forget after Note / Quiz / Resource / Discussion creation.
 */
const { Op } = require("sequelize");

// Map content type → frontend tab name (used as the deep-link)
const TYPE_TO_TAB = {
  note: "notes",
  quiz: "quizzes",
  resource: "resources",
  discussion: "discussions",
};

/**
 * Notify all qualifying students in the same school about new content.
 *
 * @param {object} content  - Sequelize instance (Note, Quiz, Resource, or Discussion)
 * @param {string} type     - "note" | "quiz" | "resource" | "discussion"
 */
async function notifyStudents(content, type) {
  try {
    const User = require("../models/User");
    const Notification = require("../models/Notification");

    // Build student filter — must be in same school, active, confirmed
    const where = {
      role: "student",
      isActive: true,
      isConfirmed: true,
      schoolId: content.schoolId,
    };

    // Scope by level if the content has one
    if (content.level) {
      where.level = content.level;
    }

    // Scope by class if the content has one
    if (content.class) {
      where.class = content.class;
    }

    // Scope by stream (A-Level arts/science)
    if (content.stream) {
      where[Op.or] = [{ stream: null }, { stream: content.stream }];
    }

    // Scope by combination (A-Level subject combo)
    if (content.combination) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { combination: null },
            { combination: content.combination },
          ],
        },
      ];
    }

    const students = await User.findAll({ where, attributes: ["id"] });

    if (!students.length) return;

    const tab = TYPE_TO_TAB[type] || type;
    const typeEmoji =
      { note: "📝", quiz: "❓", resource: "🔗", discussion: "🗣️" }[type] ||
      "🔔";

    const notifications = students.map((student) => ({
      userId: student.id,
      schoolId: content.schoolId,
      type,
      title: `${typeEmoji} New ${type}: ${content.title}`,
      resourceId: content.id,
      link: tab,
      isRead: false,
    }));

    await Notification.bulkCreate(notifications);
    console.log(
      `🔔 Notified ${notifications.length} students about new ${type}: "${content.title}"`,
    );
  } catch (err) {
    // Non-blocking: errors here must never break content creation
    console.error("⚠️  notifyStudents error:", err.message);
  }
}

module.exports = { notifyStudents };
