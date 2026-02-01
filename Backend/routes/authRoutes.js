const express = require("express");
const router = express.Router(); // This line was missing!
const Admin = require("../models/Admin");

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for:", email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email and password",
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Check password - using comparePassword method from model
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Your account has been deactivated",
      });
    }

    // Create JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Remove password from response
    admin.password = undefined;

    res.status(200).json({
      status: "success",
      token,
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Get profile
router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No token provided",
      });
    }

    // Verify token
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );

    // Get admin
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Change password
router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No token provided",
      });
    }

    // Verify token
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );

    // Get admin with password
    const admin = await Admin.findById(decoded.id).select("+password");

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Admin not found",
      });
    }

    // Check current password
    const isPasswordValid = await admin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Create new token
    const newToken = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.status(200).json({
      status: "success",
      token: newToken,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

module.exports = router;
