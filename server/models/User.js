const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/config");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },

  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },

  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },

  class: {
    type: String,
    enum: ["s1", "s2", "s3", "s4", "s5", "s6", null],
    required: function () {
      return this.role === "student";
    },
  },

  level: {
    type: String,
    enum: ["o-level", "a-level", null],
    required: function () {
      return this.role === "student";
    },
  },

  // A-Level stream: arts or science
  stream: {
    type: String,
    enum: ["arts", "science", null],
    required: function () {
      return this.role === "student" && this.level === "a-level";
    },
  },

  // A-Level combination (now flexible so admin can add new ones)
  combination: {
    type: String,
    trim: true,
    required: function () {
      return this.role === "student" && this.level === "a-level";
    },
  },

  // Optional subjects chosen by O-Level students (typically S3/S4)
  optionalSubjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],

  // Whether the account has been confirmed/approved by an admin
  // Admins are auto-confirmed, students need admin approval
  isConfirmed: {
    type: Boolean,
    default: function () {
      // Admins are auto-confirmed, students need approval
      return this.role === "admin";
    },
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  // Auto-confirm admins (they don't need approval)
  if (this.role === "admin" && !this.isConfirmed) {
    this.isConfirmed = true;
  }

  // Hash password if it's been modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRE,
  });
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is deactivated. Please contact admin.");
  }

  // Only students need confirmation; admins are auto-confirmed
  if (user.role === "student" && !user.isConfirmed) {
    throw new Error("Account pending approval. Please contact admin.");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
