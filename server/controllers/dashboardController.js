const User = require("../models/User");
const Note = require("../models/Note");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const pendingApprovals = await User.countDocuments({
      isConfirmed: false,
      role: "student",
    });
    const totalNotes = await Note.countDocuments();
    const totalDownloads = await Note.aggregate([
      { $group: { _id: null, total: { $sum: "$downloads" } } },
    ]);

    const recentNotes = await Note.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("uploadedBy", "name email");

    const recentStudents = await User.find({ role: "student" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          pendingApprovals,
          totalNotes,
          totalDownloads: totalDownloads[0]?.total || 0,
        },
        recentNotes,
        recentStudents,
      },
    });
  } catch (error) {
    next(error);
  }
};
