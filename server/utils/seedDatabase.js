const User = require("../models/User");

const seedDatabase = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: "admin" } });

    if (adminExists) {
      console.log("Admin already exists. Skipping seed.");
      return;
    }

    const admin = await User.create({
      name: "System Admin",
      email: process.env.ADMIN_EMAIL || "admin@school.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "admin",
      isConfirmed: true,
      isActive: true,
    });

    console.log("Admin created successfully via auto-seed");
    console.log(`Email: ${admin.email}`);
  } catch (error) {
    console.error("Auto-seeding error:", error.message);
  }
};

module.exports = seedDatabase;
