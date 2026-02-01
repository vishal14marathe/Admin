const Policy = require("../models/Policy");

// Policy type mapping
const policyTypeMapping = {
  terms_conditions: "Terms & Conditions",
  privacy_policy: "Privacy Policy",
  client_policy: "Client Policy",
  refund_policy: "Refund Policy",
  shipping_policy: "Shipping Policy",
  cancellation_policy: "Cancellation Policy",
};

// Policy types array
const validPolicyTypes = Object.keys(policyTypeMapping);
const validStatuses = ["draft", "published", "archived"];

// Validation helper
const validatePolicyData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push("Title is required");
    } else if (data.title.length > 200) {
      errors.push("Title must be less than 200 characters");
    }
  }

  if (!isUpdate || data.content !== undefined) {
    if (!data.content || data.content.trim().length === 0) {
      errors.push("Content is required");
    }
  }

  if (!isUpdate || data.type !== undefined) {
    if (!data.type || !validPolicyTypes.includes(data.type)) {
      errors.push(`Type must be one of: ${validPolicyTypes.join(", ")}`);
    }
  }

  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  if (data.metaTitle && data.metaTitle.length > 150) {
    errors.push("Meta title must be less than 150 characters");
  }

  if (data.metaDescription && data.metaDescription.length > 300) {
    errors.push("Meta description must be less than 300 characters");
  }

  return errors;
};

exports.getAllPolicies = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, search } = req.query;

    // Validate query parameters
    if (type && !validPolicyTypes.includes(type)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid type. Must be one of: ${validPolicyTypes.join(", ")}`,
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Build query
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    query.isActive = true;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const policies = await Policy.find(query)
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .populate("lastUpdatedBy", "name email");

    const total = await Policy.countDocuments(query);

    // Transform data
    const transformedPolicies = policies.map((policy) => ({
      id: policy._id,
      title: policy.title,
      slug: policy.slug,
      content: policy.content,
      type: policy.type,
      typeDisplay: policyTypeMapping[policy.type] || policy.type,
      status: policy.status,
      version: policy.version,
      language: policy.language,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      publishedAt: policy.publishedAt,
      lastUpdatedBy: policy.lastUpdatedBy,
    }));

    res.status(200).json({
      status: "success",
      results: policies.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: {
        policies: transformedPolicies,
      },
    });
  } catch (error) {
    console.error("Get all policies error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policies",
    });
  }
};

exports.getPolicy = async (req, res) => {
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

    const policyWithDisplay = {
      id: policy._id,
      title: policy.title,
      slug: policy.slug,
      content: policy.content,
      type: policy.type,
      typeDisplay: policyTypeMapping[policy.type] || policy.type,
      status: policy.status,
      version: policy.version,
      language: policy.language,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
      publishedAt: policy.publishedAt,
      lastUpdatedBy: policy.lastUpdatedBy,
    };

    res.status(200).json({
      status: "success",
      data: {
        policy: policyWithDisplay,
      },
    });
  } catch (error) {
    console.error("Get policy error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch policy",
    });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    // Validate input
    const validationErrors = validatePolicyData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: validationErrors.join(", "),
      });
    }

    const policyData = {
      ...req.body,
      lastUpdatedBy: req.admin.id,
    };

    const policy = await Policy.create(policyData);

    res.status(201).json({
      status: "success",
      data: {
        policy: {
          id: policy._id,
          title: policy.title,
          slug: policy.slug,
          type: policy.type,
          typeDisplay: policyTypeMapping[policy.type] || policy.type,
          status: policy.status,
          version: policy.version,
        },
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

    res.status(500).json({
      status: "error",
      message: "Failed to create policy",
    });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    // Validate input
    const validationErrors = validatePolicyData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: validationErrors.join(", "),
      });
    }

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        status: "error",
        message: "Policy not found",
      });
    }

    // Update policy
    const updatedPolicy = await Policy.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastUpdatedBy: req.admin.id,
        ...(req.body.status === "published" &&
          !policy.publishedAt && { publishedAt: Date.now() }),
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("lastUpdatedBy", "name email");

    res.status(200).json({
      status: "success",
      data: {
        policy: {
          id: updatedPolicy._id,
          title: updatedPolicy.title,
          slug: updatedPolicy.slug,
          type: updatedPolicy.type,
          typeDisplay:
            policyTypeMapping[updatedPolicy.type] || updatedPolicy.type,
          status: updatedPolicy.status,
          version: updatedPolicy.version,
          updatedAt: updatedPolicy.updatedAt,
          lastUpdatedBy: updatedPolicy.lastUpdatedBy,
        },
      },
    });
  } catch (error) {
    console.error("Update policy error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "A policy with this title already exists",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update policy",
    });
  }
};

exports.deletePolicy = async (req, res) => {
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
      message: "Policy deactivated successfully",
    });
  } catch (error) {
    console.error("Delete policy error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete policy",
    });
  }
};

exports.getPolicyTypes = (req, res) => {
  const policyTypes = Object.entries(policyTypeMapping).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

  res.status(200).json({
    status: "success",
    data: {
      policyTypes,
    },
  });
};

exports.getPolicyStats = async (req, res) => {
  try {
    const stats = await Policy.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          draft: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
        },
      },
    ]);

    // Transform stats
    const transformedStats = stats.map((stat) => ({
      type: stat._id,
      typeDisplay: policyTypeMapping[stat._id] || stat._id,
      total: stat.count,
      published: stat.published,
      draft: stat.draft,
    }));

    const totalStats = await Policy.aggregate([
      {
        $group: {
          _id: null,
          totalPolicies: { $sum: 1 },
          totalPublished: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          totalDraft: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats: transformedStats,
        total: totalStats[0] || {
          totalPolicies: 0,
          totalPublished: 0,
          totalDraft: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch statistics",
    });
  }
};
