const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      "mongodb+srv://contactmarathe2025_db_user:AF8m6TMTWPe3mPKN@policys.cesqppc.mongodb.net/?appName=Policys",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log("✅ Connected to MongoDB");

    // Define Admin model
    const Admin = mongoose.model(
      "Admin",
      new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        role: String,
        isActive: Boolean,
      }),
    );

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: "admin@example.com" });

    if (existingAdmin) {
      console.log("ℹ️ Admin already exists:");
      console.log(existingAdmin);

      // Test the password
      const isPasswordValid = await bcrypt.compare(
        "Admin@123",
        existingAdmin.password,
      );
      console.log(
        "Password validation:",
        isPasswordValid ? "✅ Valid" : "❌ Invalid",
      );
    } else {
      console.log("❌ Admin not found, creating new one...");

      // Create new admin
      const hashedPassword = await bcrypt.hash("Admin@123", 10);

      const admin = new Admin({
        name: "Super Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "super_admin",
        isActive: true,
      });

      await admin.save();
      console.log("✅ Admin created successfully!");
      console.log("Email: admin@example.com");
      console.log("Password: Admin@123");
    }

    // List all admins
    const allAdmins = await Admin.find();
    console.log("\n📋 All admins in database:", allAdmins.length);
    allAdmins.forEach((admin) => {
      console.log(`- ${admin.email} (${admin.role})`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createAdmin();
