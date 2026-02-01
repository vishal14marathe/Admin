const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function fixAdminPassword() {
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

    // Define Admin model (same as in your models/Admin.js)
    const adminSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
    });

    adminSchema.pre("save", async function (next) {
      if (!this.isModified("password")) return next();
      this.password = await bcrypt.hash(this.password, 12);
      next();
    });

    adminSchema.methods.comparePassword = async function (candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    const Admin = mongoose.model("Admin", adminSchema);

    // Find the admin
    const admin = await Admin.findOne({ email: "admin@example.com" });

    if (!admin) {
      console.log("❌ Admin not found");
      return;
    }

    console.log("Current admin:", {
      email: admin.email,
      passwordLength: admin.password.length,
      passwordStart: admin.password.substring(0, 30) + "...",
    });

    // Test current password
    const currentTest = await bcrypt.compare("Admin@123", admin.password);
    console.log('Current password test with "Admin@123":', currentTest);

    // Update password to correct one
    admin.password = "Admin@123"; // Set plain password
    await admin.save(); // pre-save middleware will hash it

    console.log("\n✅ Password updated");

    // Verify new password works
    const updatedAdmin = await Admin.findOne({ email: "admin@example.com" });
    const newTest = await bcrypt.compare("Admin@123", updatedAdmin.password);
    console.log('New password test with "Admin@123":', newTest);

    if (newTest) {
      console.log("🎉 Password is now working!");
    } else {
      console.log("❌ Still not working");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixAdminPassword();
