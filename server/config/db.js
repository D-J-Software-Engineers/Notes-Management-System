// ============================================
// DATABASE CONNECTION FILE
// This connects your app to MongoDB
// ============================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.error("");
    console.error("💡 Troubleshooting Tips:");
    console.error("   1. Check if MONGODB_URI is set in your .env file");
    console.error("   2. Verify your MongoDB Atlas cluster is running");
    console.error(
      "   3. Check if your IP address is whitelisted in MongoDB Atlas",
    );
    console.error("   4. Ensure username and password are correct");
    console.error("");
    process.exit(1);
  }
};

module.exports = connectDB;
