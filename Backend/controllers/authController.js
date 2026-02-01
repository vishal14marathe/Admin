const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Basic validation
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email and password",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid email",
      });
    }

    // 2) Check if admin exists && password is correct
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect email or password",
      });
    }

    // Check password
    const isPasswordCorrect = await admin.correctPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect email or password",
      });
    }

    // 3) Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Your account has been deactivated.",
      });
    }

    // 4) Update last login
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    // 5) Create token
    const token = signToken(admin._id);

    // 6) Send response
    res.status(200).json({
      status: "success",
      token,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    res.status(200).json({
      status: "success",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Please provide current password and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 6 characters",
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id).select("+password");

    // Check current password
    const isPasswordCorrect = await admin.correctPassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Create new token
    const token = signToken(admin._id);

    res.status(200).json({
      status: "success",
      token,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to change password",
    });
  }
};
