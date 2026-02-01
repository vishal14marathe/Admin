const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: [
        "terms_conditions",
        "privacy_policy",
        "client_policy",
        "refund_policy",
        "shipping_policy",
        "cancellation_policy",
      ],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    language: {
      type: String,
      default: "en",
    },
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    publishedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-generate slug before validation
policySchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

module.exports = mongoose.model("Policy", policySchema);
