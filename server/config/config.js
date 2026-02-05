// ============================================
// APP CONFIGURATION
// Central place for security-related constants
// ============================================

require("dotenv").config();

// JWT configuration
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "change-this-secret-in-env",
  EXPIRE: process.env.JWT_EXPIRE || "7d", // e.g. '1d', '7d'
};

// Valid classes for O-Level and A-Level
const CLASSES = {
  OLEVEL: ["s1", "s2", "s3", "s4"],
  ALEVEL: ["s5", "s6"],
};

// Supported A-Level subject combinations
// These keys are used for validation in registration
const ALEVEL_COMBINATIONS = {
  PCM: ["Physics", "Chemistry", "Math"],
  PCB: ["Physics", "Chemistry", "Biology"],
  BCG: ["Biology", "Chemistry", "Geography"],
  HEG: ["History", "Economics", "Geography"],
  HEL: ["History", "Economics", "Literature"],
  MEG: ["Math", "Economics", "Geography"],
  DEG: ["Divinity", "Economics", "Geography"],
  MPG: ["Math", "Physics", "Geography"],
  BCM: ["Biology", "Chemistry", "Math"],
  HGL: ["History", "Geography", "Literature"],
  AKR: ["Arabic", "Kiswahili", "Religious Education"],
};

module.exports = {
  JWT_CONFIG,
  CLASSES,
  ALEVEL_COMBINATIONS,
};
