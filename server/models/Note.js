const mongoose = require("mongoose");

// Note represents an uploaded study material file
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    subject: {
      type: String,
      required: [true, "Please specify subject"],
      trim: true,
    },

    // o-level or a-level
    level: {
      type: String,
      enum: ["o-level", "a-level"],
      required: [true, "Please specify level"],
    },

    // Class this note applies to (s1–s6)
    class: {
      type: String,
      enum: ["s1", "s2", "s3", "s4", "s5", "s6"],
      required: [true, "Please specify class"],
    },

    // A-Level combination (optional)
    combination: {
      type: String,
      trim: true,
    },

    // File information
    fileName: {
      type: String,
      required: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
    },

    // Who uploaded this note
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Statistics
    views: {
      type: Number,
      default: 0,
    },

    downloads: {
      type: Number,
      default: 0,
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

// Text search index
noteSchema.index({ title: "text", description: "text", subject: "text" });

// Methods
noteSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

noteSchema.methods.incrementDownloads = async function () {
  this.downloads += 1;
  await this.save();
};

// Static methods
noteSchema.statics.getRecentNotes = async function (limit = 10) {
  return await this.find({ isActive: true })
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit);
};

noteSchema.statics.getPopularNotes = async function (limit = 10) {
  return await this.find({ isActive: true })
    .populate("uploadedBy", "name email")
    .sort({ downloads: -1, views: -1 })
    .limit(limit);
};

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
