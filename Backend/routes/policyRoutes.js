const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const Policy = require("../models/Policy");

// Public routes (no authentication required)
router.get("/public/:slug", async (req, res) => {
  try {
    const policy = await Policy.findOne({
      slug: req.params.slug,
      status: "published",
      isActive: true,
    }).populate("lastUpdatedBy", "name email");

    if (!policy) {
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    // Increment views
    policy.views += 1;
    await policy.save();

    res.status(200).json({
      status: "success",
      data: {
        policy,
      },
    });
  } catch (error) {
    console.error("Public policy error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policy",
    });
  }
});

// Protected routes (require authentication)
router.use(protect);

// Get all policies
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      search,
      sort = "-createdAt",
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (type) query.type = type;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { keywords: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const policies = await Policy.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("lastUpdatedBy", "name email");

    const total = await Policy.countDocuments(query);

    res.status(200).json({
      status: "success",
      results: policies.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: {
        policies,
      },
    });
  } catch (error) {
    console.error("Get policies error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policies",
    });
  }
});

// Get policy by ID
router.get("/:id", async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id).populate(
      "lastUpdatedBy",
      "name email",
    );

    if (!policy) {
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        policy,
      },
    });
  } catch (error) {
    console.error("Get policy error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policy",
    });
  }
});

// Create policy
router.post(
  "/",
  restrictTo("super_admin", "admin", "editor"),
  async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.title || !req.body.content || !req.body.type) {
        return res.status(400).json({
          status: "error",
          message: "Title, content, and type are required",
        });
      }

      // Generate slug from title
      const slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .trim();

      // Validate policy type
      const validTypes = [
        "terms_conditions",
        "privacy_policy",
        "client_policy",
        "refund_policy",
        "shipping_policy",
        "cancellation_policy",
      ];

      if (!validTypes.includes(req.body.type)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
      }

      // Create policy data
      const policyData = {
        title: req.body.title,
        slug: slug,
        content: req.body.content,
        type: req.body.type,
        status: req.body.status || "draft",
        language: req.body.language || "en",
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        keywords: req.body.keywords,
        lastUpdatedBy: req.admin._id,
      };

      const policy = await Policy.create(policyData);

      res.status(201).json({
        status: "success",
        data: {
          policy,
        },
      });
    } catch (error) {
      console.error("Create policy error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          status: "error",
          message: "A policy with this title already exists",
        });
      }

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          status: "error",
          message: `Validation error: ${messages.join(", ")}`,
        });
      }

      res.status(500).json({
        status: "error",
        message: "Failed to create policy",
      });
    }
  },
);

// Update policy
// Update policy - CORRECTED VERSION
router.patch(
  "/:id",
  restrictTo("super_admin", "admin", "editor"),
  async (req, res) => {
    try {
      console.log("🔧 Update policy request received");
      console.log("Policy ID:", req.params.id);
      console.log("Update data:", req.body);
      console.log("Admin ID:", req.admin._id);

      // Get the policy ID
      const policyId = req.params.id;

      // Find the policy first
      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({
          status: "error",
          message: "Policy not found",
        });
      }

      console.log("Found policy:", {
        id: policy._id,
        title: policy.title,
        currentStatus: policy.status,
      });

      // Create update object
      const updateData = {};

      // If title is being updated, generate new slug
      if (req.body.title && req.body.title !== policy.title) {
        const newSlug = req.body.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
        updateData.slug = newSlug;
        updateData.title = req.body.title;
        console.log("Title updated, new slug:", newSlug);
      }

      // Add other fields
      if (req.body.content !== undefined) {
        updateData.content = req.body.content;
        console.log("Content updated");
      }

      if (req.body.type !== undefined) {
        updateData.type = req.body.type;
        console.log("Type updated:", req.body.type);
      }

      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
        console.log("Status updated:", req.body.status);

        // If publishing for first time, set publishedAt
        if (req.body.status === "published" && policy.status !== "published") {
          updateData.publishedAt = new Date();
          console.log("Setting publishedAt:", updateData.publishedAt);
        }
      }

      if (req.body.language !== undefined)
        updateData.language = req.body.language;
      if (req.body.metaTitle !== undefined)
        updateData.metaTitle = req.body.metaTitle;
      if (req.body.metaDescription !== undefined)
        updateData.metaDescription = req.body.metaDescription;
      if (req.body.keywords !== undefined)
        updateData.keywords = req.body.keywords;

      // Always update lastUpdatedBy
      updateData.lastUpdatedBy = req.admin._id;

      console.log("Final update data:", updateData);

      // Update the policy
      const updatedPolicy = await Policy.findByIdAndUpdate(
        policyId,
        updateData,
        {
          new: true,
          runValidators: true,
        },
      ).populate("lastUpdatedBy", "name email");

      console.log("✅ Policy updated successfully:", updatedPolicy._id);

      res.status(200).json({
        status: "success",
        data: {
          policy: updatedPolicy,
        },
      });
    } catch (error) {
      console.error("❌ Update policy error details:");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Full error:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          status: "error",
          message: "A policy with this title already exists",
        });
      }

      if (error.name === "CastError") {
        return res.status(400).json({
          status: "error",
          message: "Invalid policy ID format",
        });
      }

      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          status: "error",
          message: `Validation error: ${messages.join(", ")}`,
        });
      }

      res.status(500).json({
        status: "error",
        message: `Failed to update policy: ${error.message}`,
      });
    }
  },
);

// Delete policy (soft delete)
router.delete("/:id", restrictTo("super_admin", "admin"), async (req, res) => {
  try {
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!policy) {
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Policy deleted successfully",
    });
  } catch (error) {
    console.error("Delete policy error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete policy",
    });
  }
});

// Get policy statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const stats = await Policy.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          archived: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
          },
        },
      },
    ]);

    const totalStats = await Policy.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $group: {
          _id: null,
          totalPolicies: { $sum: 1 },
          totalPublished: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          totalViews: { $sum: "$views" },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        byType: stats,
        summary: totalStats[0] || {
          totalPolicies: 0,
          totalPublished: 0,
          totalViews: 0,
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch statistics",
    });
  }
});

// Get policy types
router.get("/types/list", async (req, res) => {
  try {
    const policyTypes = [
      { value: "terms_conditions", label: "Terms & Conditions" },
      { value: "privacy_policy", label: "Privacy Policy" },
      { value: "client_policy", label: "Client Policy" },
      { value: "refund_policy", label: "Refund Policy" },
      { value: "shipping_policy", label: "Shipping Policy" },
      { value: "cancellation_policy", label: "Cancellation Policy" },
    ];

    res.status(200).json({
      status: "success",
      data: {
        policyTypes,
      },
    });
  } catch (error) {
    console.error("Get policy types error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policy types",
    });
  }
});

// Get policy statuses
router.get("/statuses/list", async (req, res) => {
  try {
    const statuses = [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" },
    ];

    res.status(200).json({
      status: "success",
      data: {
        statuses,
      },
    });
  } catch (error) {
    console.error("Get statuses error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch statuses",
    });
  }
});

// Search policies
router.get("/search/quick", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: "error",
        message: "Search query must be at least 2 characters",
      });
    }

    const policies = await Policy.find({
      isActive: true,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { keywords: { $regex: q, $options: "i" } },
      ],
    })
      .select("title slug type status createdAt")
      .limit(10)
      .sort("-createdAt");

    res.status(200).json({
      status: "success",
      data: {
        policies,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to search policies",
    });
  }
});

// Get recent policies
router.get("/recent/list", async (req, res) => {
  try {
    const policies = await Policy.find({ isActive: true })
      .select("title slug type status createdAt updatedAt")
      .sort("-updatedAt")
      .limit(5)
      .populate("lastUpdatedBy", "name");

    res.status(200).json({
      status: "success",
      data: {
        policies,
      },
    });
  } catch (error) {
    console.error("Get recent policies error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch recent policies",
    });
  }
});

// Duplicate policy
router.post(
  "/:id/duplicate",
  restrictTo("super_admin", "admin", "editor"),
  async (req, res) => {
    try {
      const originalPolicy = await Policy.findById(req.params.id);

      if (!originalPolicy) {
        return res.status(404).json({
          status: "error",
          message: "Policy not found",
        });
      }

      // Create duplicate with unique title and slug
      const duplicateTitle = `${originalPolicy.title} (Copy)`;
      const duplicateSlug = `${originalPolicy.slug}-copy-${Date.now()}`;

      const duplicatePolicy = await Policy.create({
        title: duplicateTitle,
        slug: duplicateSlug,
        content: originalPolicy.content,
        type: originalPolicy.type,
        status: "draft", // Always set duplicate as draft
        language: originalPolicy.language,
        metaTitle: originalPolicy.metaTitle,
        metaDescription: originalPolicy.metaDescription,
        keywords: originalPolicy.keywords,
        lastUpdatedBy: req.admin._id,
      });

      res.status(201).json({
        status: "success",
        data: {
          policy: duplicatePolicy,
        },
      });
    } catch (error) {
      console.error("Duplicate policy error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to duplicate policy",
      });
    }
  },
);

// Bulk update policies status
router.patch(
  "/bulk/status",
  restrictTo("super_admin", "admin"),
  async (req, res) => {
    try {
      const { policyIds, status } = req.body;

      if (!policyIds || !Array.isArray(policyIds) || policyIds.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Policy IDs array is required",
        });
      }

      if (!status || !["draft", "published", "archived"].includes(status)) {
        return res.status(400).json({
          status: "error",
          message: "Valid status is required (draft, published, or archived)",
        });
      }

      const updateData = { status, lastUpdatedBy: req.admin._id };

      // If publishing, set publishedAt
      if (status === "published") {
        updateData.publishedAt = new Date();
      }

      const result = await Policy.updateMany(
        { _id: { $in: policyIds }, isActive: true },
        updateData,
      );

      res.status(200).json({
        status: "success",
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          message: `${result.modifiedCount} policies updated to ${status}`,
        },
      });
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to bulk update policies",
      });
    }
  },
);

// Get policies by type
router.get("/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { status } = req.query;

    const query = {
      type,
      isActive: true,
    };

    if (status) {
      query.status = status;
    }

    const policies = await Policy.find(query)
      .select("title slug status createdAt publishedAt")
      .sort("-createdAt")
      .populate("lastUpdatedBy", "name");

    res.status(200).json({
      status: "success",
      data: {
        policies,
        count: policies.length,
      },
    });
  } catch (error) {
    console.error("Get policies by type error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policies by type",
    });
  }
});

// Dashboard stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    // Get total policies count
    const totalPolicies = await Policy.countDocuments({ isActive: true });

    // Get published policies count
    const publishedPolicies = await Policy.countDocuments({
      isActive: true,
      status: "published",
    });

    // Get draft policies count
    const draftPolicies = await Policy.countDocuments({
      isActive: true,
      status: "draft",
    });

    // Get archived policies count
    const archivedPolicies = await Policy.countDocuments({
      isActive: true,
      status: "archived",
    });

    // Get recent policies
    const recentPolicies = await Policy.find({ isActive: true })
      .sort("-createdAt")
      .limit(5)
      .select("title type status createdAt")
      .populate("lastUpdatedBy", "name");

    // Get policies by type
    const policiesByType = await Policy.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalPolicies,
        publishedPolicies,
        draftPolicies,
        archivedPolicies,
        recentPolicies,
        policiesByType,
        summary: {
          total: totalPolicies,
          published: publishedPolicies,
          draft: draftPolicies,
          archived: archivedPolicies,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch dashboard statistics",
    });
  }
});

module.exports = router;
