const School = require("../models/School");
const User = require("../models/User");
const Note = require("../models/Note");
const Quiz = require("../models/Quiz");
const { Sequelize, sequelize } = require("../config/db");
const { generateLicenseKey } = require("../utils/licenseGenerator");

/**
 * Controller for the Super Admin dashboard to manage the entire Platform
 */
exports.getGlobalStats = async (req, res) => {
  try {
    const stats = {
      schools: await School.count(),
      users: await User.count(),
      notes: await Note.count(),
      quizzes: await Quiz.count(),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all schools
 */
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, data: schools });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new school (Tenant)
 */
exports.createSchool = async (req, res) => {
  try {
    const { name, slug, isSaaS, subscriptionDays } = req.body;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (subscriptionDays || 365));

    const school = await sequelize.transaction(async (t) => {
      const newSchool = await School.create(
        {
          name,
          slug,
          isSaaS: isSaaS !== undefined ? isSaaS : true,
          subscriptionExpiresAt: expiresAt,
          isActive: true,
        },
        { transaction: t },
      );

      // SEEDING PHASE: Clone global curriculum subjects for the new school
      const Subject = require("../models/Subject");
      const globalSubjects = await Subject.findAll({
        where: { schoolId: null },
        transaction: t,
      });

      if (globalSubjects.length > 0) {
        const schoolSubjects = globalSubjects.map((sub) => ({
          name: sub.name,
          code: sub.code,
          level: sub.level,
          class: sub.class,
          isCompulsory: sub.isCompulsory,
          isSubsidiary: sub.isSubsidiary,
          stream: sub.stream,
          schoolId: newSchool.id,
        }));
        await Subject.bulkCreate(schoolSubjects, { transaction: t });
        console.log(
          `Seeded ${schoolSubjects.length} subjects for new school: ${name}`,
        );
      }

      return newSchool;
    });

    res.status(201).json({ success: true, data: school });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update school status (Kill Switch)
 */
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });

    const { isActive, name, subscriptionExpiresAt } = req.body;

    if (isActive !== undefined) school.isActive = isActive;
    if (name) school.name = name;
    if (subscriptionExpiresAt)
      school.subscriptionExpiresAt = subscriptionExpiresAt;

    await school.save();
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete a school permanently
 */
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });

    // Safety: prevent deleting the system admin school
    if (school.slug === "system-admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete the System Management school.",
      });
    }

    // CASCADE DELETE: Manually delete associated data to avoid FK constraint errors
    const where = { schoolId: school.id };

    console.log(`Cascading delete for school: ${school.name} (${school.id})`);

    // Use a transaction for atomic safety
    await sequelize.transaction(async (t) => {
      await User.destroy({ where, transaction: t });
      await Note.destroy({ where, transaction: t });
      await Quiz.destroy({ where, transaction: t });
      await require("../models/Subject").destroy({ where, transaction: t });
      await require("../models/Resource").destroy({ where, transaction: t });
      await require("../models/Discussion").destroy({ where, transaction: t });

      // Try to delete class streams if the model exists
      try {
        const ClassStream = require("../models/ClassStream");
        await ClassStream.destroy({ where, transaction: t });
      } catch (e) {
        // Ignore if model not yet defined
      }

      await school.destroy({ transaction: t });
    });

    res.status(200).json({
      success: true,
      message: `School '${school.name}' and all associated data have been permanently deleted.`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get revenue stats for a specific school (students only, not admins/teachers)
 */
exports.getSchoolRevenue = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });

    const studentCount = await User.count({
      where: { schoolId: school.id, role: "student" },
    });

    const feePerStudent = school.feePerStudent || 2000;
    const totalRevenue = studentCount * feePerStudent;

    const confirmedCount = await User.count({
      where: { schoolId: school.id, role: "student", isConfirmed: true },
    });

    res.status(200).json({
      success: true,
      data: {
        schoolName: school.name,
        feePerStudent,
        totalStudents: studentCount,
        confirmedStudents: confirmedCount,
        pendingStudents: studentCount - confirmedCount,
        expectedRevenue: totalRevenue,
        currency: "UGX",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update the fee per student for a specific school
 */
exports.updateSchoolFee = async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school)
      return res
        .status(404)
        .json({ success: false, message: "School not found" });

    const { feePerStudent } = req.body;
    if (feePerStudent === undefined || feePerStudent < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid fee amount.",
      });
    }

    school.feePerStudent = feePerStudent;
    await school.save();

    res.status(200).json({
      success: true,
      data: school,
      message: `Fee updated to UGX ${feePerStudent.toLocaleString()} per student.`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Generate a standalone license key
 */
exports.generateLicense = async (req, res) => {
  try {
    const { days } = req.body;
    const key = generateLicenseKey(days || 365);
    res.status(200).json({ success: true, data: { licenseKey: key } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
