const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
dotenv.config();
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const streamRoutes = require("./routes/classStreamRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ... imports

const app = express();

// Basic security middleware - CSP relaxed for LAN access
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP temporarily for easier LAN/testing
    crossOriginEmbedderPolicy: false,
  }),
);

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for dev)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.use(cors({ origin: "*" })); // Allow all origins for LAN testing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger for debugging LAN access
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`,
  );
  next();
});

// Removed manual CSP middleware as Helmet handles it now

// Serve static files
app.use(
  express.static(path.join(__dirname, "../client/public"), {
    setHeaders: (res, filepath) => {
      if (filepath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  }),
);
app.use("/pages", express.static(path.join(__dirname, "../client/pages")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Server is working perfectly!",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
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
      console.log("");
      console.log("================================================");
      console.log(`Server running on:`);
      console.log(`- Local:   http://localhost:${PORT}`);
      console.log(`- Network: http://192.168.100.2:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("Database: Connected");
      console.log("================================================");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  process.exit(1);
});
