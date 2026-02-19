const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const User = require("./User");

const Resource = sequelize.define(
  "Resource",
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
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Please provide a URL" },
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    class: {
      type: DataTypes.ENUM("s1", "s2", "s3", "s4", "s5", "s6"),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM("o-level", "a-level"),
      allowNull: false,
    },
    // O-Level: optional — if set, only students in this class stream see this resource
    classStream: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // A-Level: arts or science — determines which stream students see this resource
    stream: {
      type: DataTypes.ENUM("arts", "science"),
      allowNull: true,
    },
    // A-Level: dynamic combination string (e.g. "PHY-ECO-MAT")
    combination: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    addedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "resources",
    timestamps: true,
    indexes: [
      { fields: ["class"] },
      { fields: ["level"] },
      { fields: ["subject"] },
    ],
  },
);

Resource.belongsTo(User, { foreignKey: "addedById", as: "addedBy" });

module.exports = Resource;
