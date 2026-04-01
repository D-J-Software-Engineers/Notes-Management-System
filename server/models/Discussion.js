const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./User");

const Discussion = sequelize.define(
  "Discussion",
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
        notEmpty: { msg: "Title is required" },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Description is required" },
      },
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: { msg: "Must be a valid URL" },
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
    publicationText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "discussions",
    timestamps: true,
    indexes: [{ fields: ["class", "level"] }, { fields: ["status"] }],
  },
);

Discussion.belongsTo(User, { foreignKey: "createdById", as: "createdBy" });

module.exports = Discussion;
