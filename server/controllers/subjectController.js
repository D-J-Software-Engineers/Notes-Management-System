const Subject = require("../models/Subject");
const { ErrorResponse } = require("../middleware/errorHandler");

// @desc    Create new subject (admin)
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subjects with filters
// @route   GET /api/subjects
// @access  Private (students/admin)
exports.getSubjects = async (req, res, next) => {
  try {
    const { level, class: classLevel, isCompulsory, stream } = req.query;

    const query = { isActive: true };

    if (level) query.level = level;
    if (classLevel) query.class = classLevel;
    if (typeof isCompulsory !== "undefined") {
      query.isCompulsory = isCompulsory === "true";
    }
    if (stream) query.stream = stream;

    const subjects = await Subject.find(query).sort({ class: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject || !subject.isActive) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject (admin)
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject (admin) - soft delete
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return next(new ErrorResponse("Subject not found", 404));
    }

    subject.isActive = false;
    await subject.save();

    res.status(200).json({
      success: true,
      message: "Subject deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};
