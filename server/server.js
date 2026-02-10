const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
dotenv.config();
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https:; " +
    "media-src 'self' data: blob:; " +
    "connect-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com"
  );
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client/public'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));
app.use('/pages', express.static(path.join(__dirname, '../client/pages')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Server is working perfectly!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log('');
      console.log('================================================');
      console.log('Notes Management System Server');
      console.log('================================================');
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('Database: Connected');
      console.log('================================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  process.exit(1);
});
