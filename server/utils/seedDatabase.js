const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ where: { role: 'admin' } });

    if (adminExists) {
      console.log('⚠️  Admin already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'System Admin',
      email: process.env.ADMIN_EMAIL || 'admin@school.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      isConfirmed: true,
      isActive: true
    });

    console.log('✅ Admin created successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log('🔒 Password: Check your .env file');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();