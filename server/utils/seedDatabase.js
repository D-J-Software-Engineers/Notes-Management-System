const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected");

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log(" Admin already exists");
      process.exit(0);
    }

    const admin = await User.create({
      name: "System Admin",
      email: process.env.ADMIN_EMAIL || "admin@school.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "admin",
    });

    console.log("Admin created successfully");
    console.log(`Email: ${admin.email}`);
    console.log("Password: Check your .env file");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
