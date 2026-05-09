const express = require("express");
const router = express.Router();
const School = require("../models/School");
const { protect } = require("../middleware/auth");

router.get("/status", protect, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      // Super admin or system user
      return res.json({
        success: true,
        data: {
          isActivated: true,
          installationDate: new Date(),
          daysRemaining: 9999,
        },
      });
    }

    const school = await School.findByPk(schoolId);
    if (!school) {
      return res
        .status(404)
        .json({ success: false, message: "School not found" });
    }

    const expiresAt = new Date(school.subscriptionExpiresAt || new Date());
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    const isActivated = daysRemaining > 0;

    res.json({
      success: true,
      data: {
        isActivated,
        installationDate: school.createdAt,
        daysRemaining,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
