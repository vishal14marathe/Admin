const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://admin-frotend.onrender.com/"],
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/policy_admin_db",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    console.log("Connected to MongoDB");

    // Create default admin if not exists
    createDefaultAdmin();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Create default admin function
// Create default admin function
const createDefaultAdmin = async () => {
  try {
    const bcrypt = require("bcryptjs");
    const Admin = require("./models/Admin");

    const adminExists = await Admin.findOne({
      email: process.env.ADMIN_EMAIL || "admin@example.com",
    });

    if (!adminExists) {
      console.log("Creating default admin...");

      // Use the same hashing method as in Admin model
      const admin = new Admin({
        name: "Super Admin",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        password: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123", // Plain password
        role: "super_admin",
        isActive: true,
      });

      // Let the Admin model's pre-save middleware hash the password
      await admin.save();

      console.log("✅ Default admin created successfully");
      console.log(`Email: ${process.env.ADMIN_EMAIL || "admin@example.com"}`);
      console.log(
        `Password: ${process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123"}`,
      );
    } else {
      console.log("✅ Admin already exists");

      // Test the password
      const isValid = await adminExists.comparePassword(
        process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123",
      );

      if (isValid) {
        console.log("✅ Admin password is valid");
      } else {
        console.log("❌ Admin password is INVALID - password mismatch");
        console.log(
          "Try using: vishalmarathe2024@gmail.com if you created that account",
        );
      }
    }
  } catch (error) {
    console.error("Error creating default admin:", error.message);
  }
};

// Import routes (ONCE!)
const authRoutes = require("./routes/authRoutes");
const policyRoutes = require("./routes/policyRoutes");

// Routes
console.log("🔍 Registering routes...");
app.use("/api/auth", authRoutes);
app.use("/api/policies", policyRoutes);
console.log("✅ Routes registered");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Basic 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("\n📋 Available endpoints:");
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
  console.log(`   GET  http://localhost:${PORT}/api/policies`);
  console.log(`   POST http://localhost:${PORT}/api/policies`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
});
