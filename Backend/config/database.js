const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create default admin if not exists
    await createDefaultAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  const Admin = require("../models/Admin");
  const bcrypt = require("bcryptjs");

  try {
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD,
        10,
      );

      await Admin.create({
        name: "Super Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: "super_admin",
      });

      console.log("Default admin created successfully");
      console.log(`Email: ${process.env.ADMIN_EMAIL}`);
      console.log(`Password: ${process.env.DEFAULT_ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

module.exports = connectDB;
