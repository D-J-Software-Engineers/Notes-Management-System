const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    schoolId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "schools", key: "id" },
    },
    // "note" | "quiz" | "resource" | "discussion"
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // UUID of the Note / Quiz / Resource / Discussion
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Frontend deep-link fragment e.g. "notes", "quizzes"
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["schoolId"] },
      { fields: ["isRead"] },
      { fields: ["userId", "isRead"] },
      { fields: ["createdAt"] },
    ],
  },
);

module.exports = Notification;
