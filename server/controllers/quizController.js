const Quiz = require("../models/Quiz");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const fs = require("fs").promises;
const path = require("path");
const { Op } = require("sequelize");

// @desc    Get all quizzes with filters
// @route   GET /api/quizzes
// @access  Private
exports.getAllQuizzes = async (req, res, next) => {
  try {
    const {
      level,
      class: classLevel,
      subject,
      combination,
      classStream,
      stream,
      search,
      limit = 20,
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

    if (andConditions.length) {
      where[Op.and] = andConditions;
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;

    const { rows: quizzes, count: total } = await Quiz.findAndCountAll({
      where,
      include: [
        { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        { model: User, as: "uploadedBy", attributes: ["id", "name", "email"] },
      ],
    });

    if (!quiz) {
      return next(new ErrorResponse("Quiz not found", 404));
    }

    await quiz.incrementViews();

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private (Admin only)
exports.createQuiz = async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      class: classLevel,
      level,
      combination,
      classStream,
      stream,
      type,
      content,
    } = req.body;

    const quizData = {
      title,
      description,
      subject,
      class: classLevel,
      level,
      combination: combination || null,
      classStream: classStream || null,
      stream: stream || null,
      type: type || "file",
      content: content || null,
      uploadedById: req.user.id,
    };

    if (
      quizData.type === "plain" &&
      (!quizData.content || quizData.content.trim() === "")
    ) {
      return next(
        new ErrorResponse(
          "Please provide quiz content for a plain text quiz",
          400,
        ),
      );
    }

    if (type === "file") {
      if (!req.file) {
        return next(
          new ErrorResponse("Please upload a file for file-type quiz", 400),
        );
      }
      quizData.fileName = req.file.filename;
      quizData.originalFileName = req.file.originalname;
      quizData.filePath = req.file.path;
      quizData.fileSize = req.file.size;
      quizData.fileType = req.file.mimetype;
    }

    const quiz = await Quiz.create(quizData);

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      data: quiz,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Admin only)
exports.updateQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return next(new ErrorResponse("Quiz not found", 404));
    }

    const {
      title,
      description,
      subject,
      class: classLevel,
      level,
      combination,
      classStream,
      stream,
      type,
      content,
    } = req.body;

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (subject) quiz.subject = subject;
    if (classLevel) quiz.class = classLevel;
    if (level) quiz.level = level;
    if (combination !== undefined) quiz.combination = combination;
    if (classStream !== undefined) quiz.classStream = classStream;
    if (stream !== undefined) quiz.stream = stream;
    if (type) quiz.type = type;
    if (content !== undefined) quiz.content = content;

    if (
      quiz.type === "plain" &&
      (!quiz.content || quiz.content.trim() === "")
    ) {
      return next(
        new ErrorResponse(
          "Please provide quiz content for a plain text quiz",
          400,
        ),
      );
    }

    if (req.file) {
      if (quiz.filePath) {
        await fs.unlink(quiz.filePath).catch(console.error);
      }
      quiz.fileName = req.file.filename;
      quiz.originalFileName = req.file.originalname;
      quiz.filePath = req.file.path;
      quiz.fileSize = req.file.size;
      quiz.fileType = req.file.mimetype;
    }

    await quiz.save();

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Admin only)
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return next(new ErrorResponse("Quiz not found", 404));
    }

    if (quiz.filePath) {
      await fs.unlink(quiz.filePath).catch(console.error);
    }

    await quiz.destroy();

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download quiz
// @route   GET /api/quizzes/:id/download
// @access  Private
exports.downloadQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz || quiz.type !== "file") {
      return next(new ErrorResponse("Quiz file not found", 404));
    }

    await quiz.incrementDownloads();

    res.download(quiz.filePath, quiz.originalFileName);
  } catch (error) {
    next(error);
  }
};

// @desc    View quiz
// @route   GET /api/quizzes/:id/view
// @access  Private
exports.viewQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return next(new ErrorResponse("Quiz not found", 404));
    }

    if (quiz.type === "plain") {
      await quiz.incrementViews();
      return res.status(200).json({
        success: true,
        data: quiz,
      });
    }

    await quiz.incrementViews();

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${quiz.originalFileName}"`,
    );
    res.sendFile(path.resolve(process.cwd(), quiz.filePath));
  } catch (error) {
    next(error);
  }
};
