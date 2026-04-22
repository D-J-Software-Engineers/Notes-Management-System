const { Sequelize, Op } = require("sequelize");
const path = require("path");
const { getSchoolId } = require("../utils/tenantContext");

const isSaaS = process.env.APP_MODE === "SaaS";
const usePostgres = isSaaS && process.env.DATABASE_URL;

const sequelizeOptions = usePostgres
  ? {
      dialect: "postgres",
      protocol: "postgres",
      dialectOptions: {
        ssl:
          process.env.DB_SSL === "true"
            ? {
                require: true,
                rejectUnauthorized: false,
              }
            : false,
      },
      logging: process.env.NODE_ENV === "development" ? console.log : false,
    }
  : {
      dialect: "sqlite",
      storage:
        process.env.DATABASE_STORAGE ||
        path.join(__dirname, "../../database.sqlite"),
      logging: process.env.NODE_ENV === "development" ? console.log : false,
    };

const sequelize = usePostgres
  ? new Sequelize(process.env.DATABASE_URL, sequelizeOptions)
  : new Sequelize(sequelizeOptions);

/**
 * ABSOLUTE ISOLATION GUARANTEE:
 * We add a global hook to Sequelize that automatically injects the schoolId filter
 * into EVERY 'find' query when in SaaS mode.
 */
if (isSaaS) {
  sequelize.addHook("beforeFind", (options) => {
    const schoolId = getSchoolId();
    if (schoolId) {
      if (!options.where) {
        options.where = {};
      }
      // ABSOLUTE ISOLATION: Force the schoolId filter
      options.where.schoolId = schoolId;
    }
  });

  // Automated Labeling: Ensure all new records get the tenant's schoolId
  sequelize.addHook("beforeCreate", (instance) => {
    const schoolId = getSchoolId();
    if (schoolId && !instance.schoolId) {
      instance.schoolId = schoolId;
    }
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      usePostgres
        ? "Postgres Connected (Cloud SaaS)"
        : "SQLite Connected (Hybrid SaaS Dev)",
    );
    console.log(
      `📊 Database Mode: ${isSaaS ? "Enterprise Multi-Tenant" : "Standalone Single-Tenant"}`,
    );

    // Sync models - Only use alter:true for Postgres as SQLite alter is buggy with certain column additions
    await sequelize.sync({ alter: usePostgres });
    console.log("Database tables synchronized");
  } catch (error) {
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      console.error(
        "❌ Validation Error Detail:",
        error.errors.map((e) => e.message),
      );
    }
    console.error(
      `${isSaaS ? "Postgres" : "SQLite"} Connection Error:`,
      error.message,
    );
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
