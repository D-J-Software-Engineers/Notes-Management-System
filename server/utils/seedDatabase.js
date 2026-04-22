const { connectDB } = require("../config/db");
const User = require("../models/User");
const Subject = require("../models/Subject");
const School = require("../models/School");
const {
  ALEVEL_COMBINATIONS,
  OLEVEL_SUBJECTS,
  ALEVEL_SUBSIDIARIES,
} = require("../config/config");

const subjectStreamMap = {
  Physics: "science",
  Chemistry: "science",
  Biology: "science",
  Mathematics: "both",
  Geography: "both",
  History: "arts",
  Economics: "arts",
  Literature: "arts",
  Divinity: "arts",
  Arabic: "arts",
  Kiswahili: "arts",
  "Religious Education": "arts",
};

const seedDatabase = async () => {
  try {
    // CRITICAL: Ensure DB is connected and synced
    await connectDB();

    // 1. Get the default system school (created by initSystem.js)
    const systemSchool = await School.findOne({
      where: { slug: "system-admin" },
    });
    if (!systemSchool) {
      console.error(
        "❌ System School not found. Please run initSystem.js first.",
      );
      return;
    }

    const schoolId = systemSchool.id;

    // 2. Seed Subjects
    console.log("Seeding O-Level subjects...");
    const oLevelClasses = ["s1", "s2", "s3", "s4"];
    for (const classLevel of oLevelClasses) {
      for (const subjectName of OLEVEL_SUBJECTS) {
        await Subject.findOrCreate({
          where: {
            name: subjectName,
            level: "o-level",
            class: classLevel,
            schoolId,
          },
          defaults: {
            code: (subjectName || "SUB").substring(0, 3).toUpperCase(),
            isCompulsory: true,
            isActive: true,
          },
        });
      }
    }

    console.log("Seeding A-Level subjects...");
    const aLevelSubjects = new Set();
    Object.values(ALEVEL_COMBINATIONS).forEach((combo) => {
      combo.subjects.forEach((s) => aLevelSubjects.add(s));
    });

    for (const subjectName of aLevelSubjects) {
      const stream = subjectStreamMap[subjectName] || "both";
      for (const classLevel of ["s5", "s6"]) {
        await Subject.findOrCreate({
          where: {
            name: subjectName,
            level: "a-level",
            class: classLevel,
            schoolId,
          },
          defaults: {
            code: (subjectName || "SUB").substring(0, 3).toUpperCase(),
            stream: stream,
            isCompulsory: true,
            isActive: true,
          },
        });
      }
    }

    for (const subName of ALEVEL_SUBSIDIARIES) {
      for (const classLevel of ["s5", "s6"]) {
        await Subject.findOrCreate({
          where: {
            name: subName,
            level: "a-level",
            class: classLevel,
            schoolId,
          },
          defaults: {
            code: (subName || "SUB").substring(0, 3).toUpperCase(),
            isSubsidiary: true,
            isCompulsory: subName === "General Paper",
            isActive: true,
          },
        });
      }
    }

    console.log("✅ Database seeding complete.");
  } catch (error) {
    console.error("❌ Auto-seeding error:", error.message);
  }
};

module.exports = seedDatabase;
