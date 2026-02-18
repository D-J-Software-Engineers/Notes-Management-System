const ClassStream = require("../models/ClassStream");
const { ErrorResponse } = require("../middleware/errorHandler");

// @desc    Get all class streams (optionally filtered by class)
// @route   GET /api/streams
// @access  Private
exports.getAllStreams = async (req, res, next) => {
  try {
    const where = { isActive: true };
    if (req.query.class) where.class = req.query.class;

    const streams = await ClassStream.findAll({
      where,
      order: [
        ["class", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: streams.length,
      data: streams,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a class stream
// @route   POST /api/streams
// @access  Private (Admin only)
exports.createStream = async (req, res, next) => {
  try {
    const { name, class: classLevel, description } = req.body;

    if (!name || !classLevel) {
      return next(
        new ErrorResponse("Please provide stream name and class", 400),
      );
    }

    const stream = await ClassStream.create({
      name: name.trim(),
      class: classLevel,
      description: description || null,
    });

    res.status(201).json({
      success: true,
      message: "Class stream created successfully",
      data: stream,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return next(
        new ErrorResponse(
          `Stream "${req.body.name}" already exists for this class`,
          400,
        ),
      );
    }
    next(error);
  }
};

// @desc    Update a class stream
// @route   PUT /api/streams/:id
// @access  Private (Admin only)
exports.updateStream = async (req, res, next) => {
  try {
    const stream = await ClassStream.findByPk(req.params.id);
    if (!stream) return next(new ErrorResponse("Stream not found", 404));

    const { name, description } = req.body;
    if (name) stream.name = name.trim();
    if (typeof description !== "undefined") stream.description = description;

    await stream.save();

    res.status(200).json({
      success: true,
      message: "Stream updated successfully",
      data: stream,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a class stream
// @route   DELETE /api/streams/:id
// @access  Private (Admin only)
exports.deleteStream = async (req, res, next) => {
  try {
    const stream = await ClassStream.findByPk(req.params.id);
    if (!stream) return next(new ErrorResponse("Stream not found", 404));

    await stream.destroy();

    res.status(200).json({
      success: true,
      message: "Stream deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
