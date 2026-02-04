// ============================================
// MAIN SERVER FILE - This is where everything starts!
// ============================================

// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Create Express application
const app = express();

// ============================================
// MIDDLEWARE (Functions that run on every request)
// ============================================

// Enable CORS (allows frontend to talk to backend)
app.use(cors());

// Parse JSON data from requests
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '../client/public')));
app.use('/pages', express.static(path.join(__dirname, '../client/pages')));

// Serve uploaded files (notes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// ROUTES (API Endpoints)
// ============================================

// Test route to check if server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: '✅ Server is working perfectly!',
    timestamp: new Date().toISOString()
  });
});

// Import route files (we'll create these next)
// Uncomment these as we create the route files
// const authRoutes = require('./routes/authRoutes');
// const noteRoutes = require('./routes/noteRoutes');
// const userRoutes = require('./routes/userRoutes');
// const subjectRoutes = require('./routes/subjectRoutes');

// Use routes
// app.use('/api/auth', authRoutes);
// app.use('/api/notes', noteRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/subjects', subjectRoutes);

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// Catch-all route for undefined routes (404 handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// ============================================
// CONNECT TO DATABASE & START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

// Function to start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start listening for requests
    app.listen(PORT, () => {
      console.log('');
      console.log('================================================');
      console.log('🚀 Notes Management System Server');
      console.log('================================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: Connected`);
      console.log('================================================');
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1); // Exit with error
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});