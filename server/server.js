const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const connectDB = require("./config/db");

const app = express();

// Security: set HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"], // Allow scripts from same origin only (no inline scripts)
        scriptSrcAttr: ["'none'"], // Block inline event handlers (onclick, etc.)
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (needed for embedded styles)
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }),
);

// CORS: allow only configured frontend origin (or all in development)
const allowedOrigin = process.env.CLIENT_ORIGIN || "*";
app.use(
  cors(
    allowedOrigin === "*"
      ? {}
      : {
          origin: allowedOrigin,
          credentials: true,
        },
  ),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../client/public")));
app.use("/pages", express.static(path.join(__dirname, "../client/pages")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/notesRoutes");
const userRoutes = require("./routes/userRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const { errorHandler } = require("./middleware/errorHandler");

// Rate limiting for auth routes to protect against brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window for auth endpoints
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
});

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "✅ Server is working perfectly!",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("");
      console.log("================================================");
      console.log("Notes Management System Server");
      console.log("================================================");
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Database: Connected`);
      console.log("================================================");
      console.log("");
      console.log("Press Ctrl+C to stop the server");
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
