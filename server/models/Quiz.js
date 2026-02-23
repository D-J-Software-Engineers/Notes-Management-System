const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./User");

const Quiz = sequelize.define(
  "Quiz",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Please provide a title" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Please provide a subject" },
      },
    },
    class: {
      type: DataTypes.ENUM("s1", "s2", "s3", "s4", "s5", "s6"),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM("o-level", "a-level"),
      allowNull: false,
    },
    classStream: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stream: {
      type: DataTypes.ENUM("arts", "science"),
      allowNull: true,
    },
    combination: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("file", "plain"),
      allowNull: false,
      defaultValue: "file",
    },
    // For plain text quizzes
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // For file-based quizzes
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    originalFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    downloads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "quizzes",
    timestamps: true,
    indexes: [
      { fields: ["title"] },
      { fields: ["subject"] },
      { fields: ["class"] },
      { fields: ["level"] },
      { fields: ["classStream"] },
      { fields: ["stream"] },
      { fields: ["subject", "class", "level"] },
      { fields: ["createdAt"] },
    ],
  },
);

Quiz.belongsTo(User, { foreignKey: "uploadedById", as: "uploadedBy" });

Quiz.prototype.incrementDownloads = async function () {
  this.downloads += 1;
  await this.save();
  return this;
};

Quiz.prototype.incrementViews = async function () {
  this.views += 1;
  await this.save();
  return this;
};

module.exports = Quiz;
