// ============================================
// RESOURCE CONTROLLER
// Admin adds links (YouTube, etc); students view and click
// ============================================

const Resource = require("../models/Resource");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const { Op } = require("sequelize");

// @desc    Get all resources with filters
// @route   GET /api/resources
// @access  Private
exports.getAllResources = async (req, res, next) => {
  try {
    const {
      level,
      class: classLevel,
      subject,
      combination,
      classStream,
      stream,
      search,
      limit = 50,
      page = 1,
    } = req.query;

    const where = { isActive: true };
    if (level) where.level = level;
    if (classLevel) where.class = classLevel;
    if (subject) where.subject = subject;
    if (stream) where.stream = stream;
    const andConditions = [];
    if (classStream) {
      andConditions.push({
        [Op.or]: [{ classStream: null }, { classStream }],
      });
    }
    if (combination) {
      andConditions.push({
        [Op.or]: [{ combination: null }, { combination }],
      });
    }
    if (search) {
      andConditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    if (andConditions.length) where[Op.and] = andConditions;

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    const { rows: resources, count: total } = await Resource.findAndCountAll({
      where,
      include: [
        { model: User, as: "addedBy", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        { model: User, as: "addedBy", attributes: ["id", "name", "email"] },
      ],
    });
    if (!resource) {
      return next(new ErrorResponse("Resource not found", 404));
    }
    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private (Admin only)
exports.createResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      url,
      subject,
      class: classLevel,
      level,
      classStream,
      stream,
      combination,
    } = req.body;
    if (!title || !url || !classLevel || !level) {
      return next(
        new ErrorResponse("Title, URL, class, and level are required", 400),
      );
    }
    const resource = await Resource.create({
      title,
      description,
      url,
      subject: subject || null,
      class: classLevel,
      level,
      combination: combination || null,
      classStream: classStream || null,
      stream: stream || null,
      addedById: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: "Resource added successfully",
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Admin only)
exports.updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(new ErrorResponse("Resource not found", 404));
    const {
      title,
      description,
      url,
      subject,
      class: classLevel,
      level,
      combination,
      classStream,
      stream,
    } = req.body;
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (url) resource.url = url;
    if (subject !== undefined) resource.subject = subject;
    if (classLevel) resource.class = classLevel;
    if (level) resource.level = level;
    if (combination !== undefined) resource.combination = combination;
    if (classStream !== undefined) resource.classStream = classStream;
    if (stream !== undefined) resource.stream = stream;
    await resource.save();
    res
      .status(200)
      .json({ success: true, message: "Resource updated", data: resource });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Admin only)
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return next(new ErrorResponse("Resource not found", 404));
    await resource.destroy();
    res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (error) {
    next(error);
  }
};
