const User = require("../models/User");
const Note = require("../models/Note");
const School = require("../models/School");
const { Sequelize } = require("sequelize");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.count({ where: { role: "student" } });
    const pendingApprovals = await User.count({
      where: {
        isConfirmed: false,
        role: "student",
      },
    });
    const totalNotes = await Note.count();

    // Sum downloads - note: Sequelize sum returns a number or null
    const totalDownloads = (await Note.sum("downloads")) || 0;

    const recentNotes = await Note.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      ],
    });

    const recentStudents = await User.findAll({
      where: { role: "student" },
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
      include: [{ model: School, as: "school", attributes: ["id", "name"] }],
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          pendingApprovals,
          totalNotes,
          totalDownloads,
        },
        recentNotes,
        recentStudents,
      },
    });
  } catch (error) {
    next(error);
  }
};
