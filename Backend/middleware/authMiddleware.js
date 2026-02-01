const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "You are not logged in. Please log in to get access.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );

    // Check if admin still exists
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        status: "error",
        message: "The admin belonging to this token no longer exists.",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        status: "error",
        message: "Your account has been deactivated.",
      });
    }

    // Grant access
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token. Please log in again.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Your token has expired. Please log in again.",
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Authentication failed.",
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};
