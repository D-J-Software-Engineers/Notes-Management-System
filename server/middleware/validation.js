// ============================================
// VALIDATION MIDDLEWARE
// Input validation for requests
// ============================================

const { CLASSES, ALEVEL_COMBINATIONS } = require("../config/config");

// Validate registration input
exports.validateRegister = (req, res, next) => {
  const {
    name,
    email,
    password,
    role,
    class: classLevel,
    level,
    combination,
    stream,
  } = req.body;

  // Required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide name, email, and password",
    });
  }

  // Email format
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email",
    });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  // Student-specific validation
  if (role === "student") {
    if (!classLevel || !level) {
      return res.status(400).json({
        success: false,
        message: "Students must have class and level",
      });
    }

    // Validate class
    const allClasses = [...CLASSES.OLEVEL, ...CLASSES.ALEVEL];
    if (!allClasses.includes(classLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid class. Must be one of: ${allClasses.join(", ")}`,
      });
    }

    // Validate level matches class
    if (level === "o-level" && !CLASSES.OLEVEL.includes(classLevel)) {
      return res.status(400).json({
        success: false,
        message: "O-Level class must be s1, s2, s3, or s4",
      });
    }

    if (level === "a-level" && !CLASSES.ALEVEL.includes(classLevel)) {
      return res.status(400).json({
        success: false,
        message: "A-Level class must be s5 or s6",
      });
    }

    // A-level students need combination
    if (level === "a-level" && !combination) {
      return res.status(400).json({
        success: false,
        message: "A-Level students must specify subject combination",
      });
    }

    // A-Level students must choose a stream (arts or science)
    if (level === "a-level") {
      if (!stream || !["arts", "science"].includes(stream)) {
        return res.status(400).json({
          success: false,
          message:
            "A-Level students must choose a valid stream: arts or science",
        });
      }
    }
  }

  next();
};

// Validate login input
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  next();
};

// Validate note creation
exports.validateNote = (req, res, next) => {
  const { title, subject, class: classLevel, level } = req.body;

  if (!title || !subject || !classLevel || !level) {
    return res.status(400).json({
      success: false,
      message: "Please provide title, subject, class, and level",
    });
  }

  // Validate class and level
  const allClasses = [...CLASSES.OLEVEL, ...CLASSES.ALEVEL];
  if (!allClasses.includes(classLevel)) {
    return res.status(400).json({
      success: false,
      message: `Invalid class. Must be one of: ${allClasses.join(", ")}`,
    });
  }

  if (!["o-level", "a-level"].includes(level)) {
    return res.status(400).json({
      success: false,
      message: "Level must be o-level or a-level",
    });
  }

  next();
};
