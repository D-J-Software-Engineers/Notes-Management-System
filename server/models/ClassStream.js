const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// ClassStream represents an admin-defined section/stream within an O-Level class.
// e.g. "S1 A", "S1 B", "S2 Science", "S3 Morning"
const ClassStream = sequelize.define(
  "ClassStream",
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
        notEmpty: { msg: "Please provide a stream name" },
      },
    },
    // Which O-Level class this stream belongs to
    class: {
      type: DataTypes.ENUM("s1", "s2", "s3", "s4"),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "class_streams",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "class"],
      },
    ],
  },
);

module.exports = ClassStream;
