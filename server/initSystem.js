const { connectDB, sequelize } = require("./config/db");
const School = require("./models/School");
const User = require("./models/User");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Script to initialize the first Super Admin and the system's "Home" school.
 */
const initializeSystem = async () => {
  try {
    await connectDB();

    console.log("Initializing Multi-Tenant System...");

    // 1. Create the default "System Management" School
    const [systemSchool] = await School.findOrCreate({
      where: { slug: "system-admin" },
      defaults: {
        name: "Nsoma System Management",
        isActive: true,
        subscriptionExpiresAt: new Date(2099, 11, 31), // Forever
      },
    });

    console.log(`✅ System School created: ${systemSchool.name}`);

    // 2. Create the first Super Admin
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@nsoma.ug";
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin1234";

    const [adminUser, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: "System Super Admin",
        password: adminPassword,
        role: "super_admin",
        schoolId: null, // Super Admin is global
        isConfirmed: true,
        isActive: true,
      },
    });

    if (created) {
      console.log(`✅ Super Admin created: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log(`ℹ️ Super Admin already exists: ${adminEmail}`);
    }

    console.log(
      "\nSetup Complete! You can now login to the Super Admin panel.",
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Initialization Failed:", error.message);
    process.exit(1);
  }
};

initializeSystem();
