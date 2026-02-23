const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Subject represents a single curriculum subject for a given level/class.
// Admin can create/update/delete to match curriculum changes.
const Subject = sequelize.define(
  "Subject",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Please provide a subject name" },
      },
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // o-level or a-level
    level: {
      type: DataTypes.ENUM("o-level", "a-level"),
      allowNull: false,
    },
    // Class this subject applies to (s1–s6)
    class: {
      type: DataTypes.ENUM("s1", "s2", "s3", "s4", "s5", "s6"),
      allowNull: false,
    },
    // For S3/S4: compulsory vs optional
    isCompulsory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // A-Level stream this subject belongs to (arts, science)
    stream: {
      type: DataTypes.ENUM("arts", "science"),
      allowNull: true,
      validate: {
        validForLevel(value) {
          // when saving, `this.level` contains the level being set
          if (this.level === "a-level" && !value) {
            throw new Error("A-Level subject must specify a stream");
          }
          if (this.level === "o-level" && value) {
            throw new Error("O-Level subjects should not have a stream");
          }
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "subjects",
    timestamps: true,
    hooks: {
      beforeCreate: (subject) => {
        if (subject.name) {
          subject.name =
            subject.name.charAt(0).toUpperCase() +
            subject.name.slice(1).toLowerCase();
        }
        if (subject.code && subject.code.trim() !== "") {
          subject.code = subject.code.toUpperCase().trim();
        } else {
          subject.code = null;
        }
      },
      beforeUpdate: (subject) => {
        if (subject.name) {
          subject.name =
            subject.name.charAt(0).toUpperCase() +
            subject.name.slice(1).toLowerCase();
        }
        if (subject.code && subject.code.trim() !== "") {
          subject.code = subject.code.toUpperCase().trim();
        } else {
          subject.code = null;
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["name", "level", "class"],
      },
      {
        unique: true,
        fields: ["code", "level", "class"],
      },
    ],
  },
);

module.exports = Subject;
