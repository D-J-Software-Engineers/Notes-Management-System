const Subject = require("../models/Subject");
const { ALEVEL_COMBINATIONS } = require("../config/config");
const { ErrorResponse } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// @desc    Get all subjects (with optional filters)
// @route   GET /api/subjects
// @access  Private
exports.getAllSubjects = async (req, res, next) => {
  try {
    const { level, class: classLevel, stream, search } = req.query;

    const where = {};
    if (level) where.level = level;
    if (classLevel) where.class = classLevel;
    if (stream) {
      // For A-Level: match specific stream or "both"
      where.stream = { [Op.or]: [stream, "both"] };
    }
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const subjects = await Subject.findAll({
      where,
      order: [
        ["level", "ASC"],
        ["class", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by level
// @route   GET /api/subjects/level/:level
// @access  Private
exports.getSubjectsByLevel = async (req, res, next) => {
  try {
    const { level } = req.params;
    const { stream } = req.query;

    const where = { level };
    if (stream) {
      where.stream = { [Op.or]: [stream, "both"] };
    }

    const subjects = await Subject.findAll({
      where,
      order: [
        ["class", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Admin only)
exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, level, isCompulsory, isSubsidiary, stream } = req.body;

    // Automatically apply to all classes in the selected level
    const classList =
      level === "o-level" ? ["s1", "s2", "s3", "s4"] : ["s5", "s6"];

    const createdSubjects = [];

    for (const classLevel of classList) {
      const existing = await Subject.findOne({
        where: { name, level, class: classLevel },
      });

      if (!existing) {
        const subject = await Subject.create({
          name,
          code,
          level,
          class: classLevel,
          isCompulsory,
          isSubsidiary: isSubsidiary || false,
          stream: stream || null,
        });
        createdSubjects.push(subject);
      }
    }

    res.status(201).json({
      success: true,
      message: `Subject created successfully for all classes in ${level}`,
      data: createdSubjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin only)
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    const { name, code, level, isCompulsory, isSubsidiary, stream } = req.body;

    // Find all subjects with the same name in the same level and update them
    // This ensures updates propagate to all classes in the same level
    const originalName = subject.name;
    const subjectsToUpdate = await Subject.findAll({
      where: {
        name: originalName,
        level: subject.level,
      },
    });

    for (const sub of subjectsToUpdate) {
      if (name) sub.name = name;
      if (typeof code !== "undefined") sub.code = code;
      if (typeof isCompulsory !== "undefined") sub.isCompulsory = isCompulsory;
      if (typeof isSubsidiary !== "undefined") sub.isSubsidiary = isSubsidiary;
      sub.stream = stream || null;

      await sub.save();
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully for all classes in the same level",
      data: subject, // Return the originally requested subject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByPk(req.params.id);

    if (!subject) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    const { name, level } = subject;

    // Delete all subjects with the same name in the same level (all classes)
    const deletedCount = await Subject.destroy({
      where: {
        name,
        level,
      },
    });

    res.status(200).json({
      success: true,
      message: `Subject deleted successfully from all classes in the same level (${deletedCount} records removed)`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get A-Level combinations (static config)
// @route   GET /api/subjects/combinations
// @access  Private
exports.getCombinations = async (req, res, next) => {
  try {
    const combinations = Object.entries(ALEVEL_COMBINATIONS).map(
      ([code, data]) => ({
        code,
        name: data.name,
        subjects: data.subjects,
      }),
    );

    res.status(200).json({
      success: true,
      count: combinations.length,
      data: combinations,
    });
  } catch (error) {
    next(error);
  }
};
