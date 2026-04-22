const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const School = sequelize.define(
  "School",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "School name is required" },
      },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "URL-friendly name for the school",
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subscriptionExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1); // Default to 1 year for new schools
        return date;
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "The 'Kill Switch' for defaulters",
    },
    // Optional: Max students or resources for this school tier
    maxStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 500,
    },
    isSaaS: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "True for Cloud hosting, False for local lab installations",
    },
    feePerStudent: {
      type: DataTypes.INTEGER,
      defaultValue: 2000,
      comment: "Amount in UGX charged per student per term/session",
    },
  },
  {
    tableName: "schools",
    timestamps: true,
  },
);

module.exports = School;
