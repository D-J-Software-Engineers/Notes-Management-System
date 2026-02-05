const mongoose = require("mongoose");

// Subject represents a single curriculum subject for a given level/class.
// Admin can create/update/delete to match curriculum changes.
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a subject name"],
      trim: true,
    },

    code: {
      type: String,
      trim: true,
    },

    // o-level or a-level
    level: {
      type: String,
      enum: ["o-level", "a-level"],
      required: [true, "Please specify subject level"],
    },

    // Class this subject applies to (s1–s6)
    class: {
      type: String,
      enum: ["s1", "s2", "s3", "s4", "s5", "s6"],
      required: [true, "Please specify class"],
    },

    // For S3/S4: compulsory vs optional
    isCompulsory: {
      type: Boolean,
      default: true,
    },

    // A-Level stream this subject belongs to (arts, science or both)
    stream: {
      type: String,
      enum: ["arts", "science", "both", null],
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure subject names are unique per class/level
subjectSchema.index({ name: 1, level: 1, class: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
