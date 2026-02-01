import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/axios";
import {
  FaSave,
  FaTimes,
  FaFileAlt,
  FaEye,
  FaCalendar,
  FaArrowLeft,
  FaMagic,
  FaInfoCircle,
  FaCheck,
  FaExclamationTriangle,
  FaCopy,
} from "react-icons/fa";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const AddPolicy = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    type: "privacy",
    content: "",
    version: "1.0.0",
    status: "draft",
    effectiveDate: new Date().toISOString().split("T")[0],
    description: "",
    requiresConsent: false,
  });

  const policyTypes = [
    { value: "privacy", label: "Privacy Policy", icon: "🔒" },
    { value: "terms", label: "Terms & Conditions", icon: "📄" },
    { value: "cookies", label: "Cookie Policy", icon: "🍪" },
    { value: "refund", label: "Refund Policy", icon: "💰" },
    { value: "shipping", label: "Shipping Policy", icon: "🚚" },
    { value: "other", label: "Other", icon: "📝" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft", color: "text-yellow-600 bg-yellow-100" },
    {
      value: "published",
      label: "Published",
      color: "text-green-600 bg-green-100",
    },
    {
      value: "archived",
      label: "Archived",
      color: "text-gray-600 bg-gray-100",
    },
  ];

  // Rich text editor modules
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
      ["code-block"],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "align",
    "color",
    "background",
    "font",
    "size",
    "code-block",
  ];

  // Update character and word counts
  useEffect(() => {
    const textContent = formData.content.replace(/<[^>]*>/g, "");
    setCharacterCount(textContent.length);
    setWordCount(
      textContent
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
    );
  }, [formData.content]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }

    // Clear validation errors
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: "",
      });
    }
  };

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content,
    });

    if (errors.content) {
      setErrors({
        ...errors,
        content: "",
      });
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({
      ...formData,
      type: newType,
    });

    // If title is empty, suggest one based on type
    if (!formData.title.trim()) {
      const typeName = policyTypes.find((t) => t.value === newType)?.label;
      setFormData((prev) => ({
        ...prev,
        type: newType,
        title: `${typeName} for [Your Company]`,
      }));
    }
  };

  const loadTemplate = async (type) => {
    try {
      setLoading(true);
      const response = await api.get(`/policies/templates/${type}`);
      const template = response.data.template;

      setFormData({
        ...formData,
        title: template.title,
        content: template.content,
        version: template.version,
        description: template.description || "",
        type: type,
      });

      setShowTemplateModal(false);
      alert(`✅ ${template.title} template loaded!`);
    } catch (err) {
      console.error("Error loading template:", err);
      alert("Failed to load template. Using default format.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = async () => {
    try {
      const response = await api.post("/policies/validate", {
        title: formData.title,
        type: formData.type,
        content: formData.content,
        version: formData.version,
      });

      if (response.data.success) {
        setValidationErrors({});
        return true;
      } else {
        setValidationErrors(response.data.errors || {});
        return false;
      }
    } catch (err) {
      console.error("Validation error:", err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Frontend validation
    const frontendErrors = {};
    if (!formData.title.trim()) {
      frontendErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      frontendErrors.title = "Title must be at least 3 characters";
    }

    if (
      !formData.content.trim() ||
      formData.content.replace(/<[^>]*>/g, "").trim().length < 10
    ) {
      frontendErrors.content = "Content must be at least 10 characters";
    }

    if (!formData.version.trim()) {
      frontendErrors.version = "Version is required";
    } else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
      frontendErrors.version = "Version must be in format x.x.x (e.g., 1.0.0)";
    }

    if (Object.keys(frontendErrors).length > 0) {
      setErrors(frontendErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Backend validation
    const isValid = await validateForm();
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        effectiveDate: new Date(formData.effectiveDate),
      };

      const response = await api.post("/policies", payload);

      if (response.data.success) {
        alert("✅ Policy created successfully!");
        navigate("/policies");
      }
    } catch (err) {
      console.error("Error creating policy:", err);

      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.error) {
        setErrors({ general: err.response.data.error });
        alert(`❌ Error: ${err.response.data.error}`);
      } else {
        setErrors({ general: "Failed to create policy. Please try again." });
        alert("❌ Failed to create policy. Please try again.");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickFill = (type) => {
    const examples = {
      privacy: {
        title: "Privacy Policy for Tech Solutions Inc.",
        description: "Protects user data and privacy rights",
        content: `
<h1>Privacy Policy</h1>
<p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Version:</strong> 1.0.0</p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, fill out a form, or contact us for support.</p>

<h2>2. How We Use Your Information</h2>
<ul>
  <li>To provide, maintain, and improve our services</li>
  <li>To communicate with you about products, services, and promotions</li>
  <li>To monitor and analyze trends, usage, and activities</li>
</ul>

<h2>3. Data Security</h2>
<p>We implement appropriate technical and organizational security measures to protect your personal information.</p>

<h2>4. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal information at any time.</p>

<h2>5. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at privacy@example.com.</p>
`,
      },
      terms: {
        title: "Terms of Service - Tech Solutions Inc.",
        description: "Governs use of our platform and services",
        content: `
<h1>Terms of Service</h1>
<p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Version:</strong> 1.0.0</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using our services, you agree to be bound by these Terms of Service.</p>

<h2>2. User Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account and password.</p>

<h2>3. Acceptable Use</h2>
<p>You agree not to use the service for any illegal purpose or in violation of any laws.</p>

<h2>4. Intellectual Property</h2>
<p>All content included on our platform is the property of Tech Solutions Inc. or its content suppliers.</p>

<h2>5. Termination</h2>
<p>We may terminate or suspend your account immediately for violation of these Terms.</p>
`,
      },
    };

    const example = examples[type];
    if (example) {
      setFormData({
        ...formData,
        title: example.title,
        description: example.description,
        content: example.content,
        type: type,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Link
                to="/policies"
                className="flex items-center text-gray-600 hover:text-blue-600 transition duration-300"
              >
                <FaArrowLeft className="mr-2" />
                Back to Policies
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Create New Policy
            </h1>
            <p className="text-gray-600 mt-2">
              Add a new policy document for your website or application
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPreview(!preview)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center hover:bg-gray-50 transition duration-300"
            >
              {preview ? (
                <>
                  <FaEye className="mr-2" />
                  Edit Mode
                </>
              ) : (
                <>
                  <FaEye className="mr-2" />
                  Preview
                </>
              )}
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center hover:bg-purple-700 transition duration-300"
            >
              <FaMagic className="mr-2" />
              Use Template
            </button>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <FaExclamationTriangle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <FaExclamationTriangle className="mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-2">
                Please fix the following errors:
              </p>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {preview ? (
        /* Preview Mode */
        <div className="bg-white rounded-xl shadow p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                {formData.title}
              </h1>
              <div className="flex flex-wrap justify-center items-center gap-3 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {policyTypes.find((t) => t.value === formData.type)?.label}
                </span>
                <span className="text-gray-600">
                  Version: {formData.version}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Effective:{" "}
                  {new Date(formData.effectiveDate).toLocaleDateString()}
                </span>
                <span className="text-gray-400">•</span>
                <span
                  className={`px-3 py-1 rounded-full font-medium ${
                    statusOptions.find((s) => s.value === formData.status)
                      ?.color
                  }`}
                >
                  {formData.status.charAt(0).toUpperCase() +
                    formData.status.slice(1)}
                </span>
              </div>
              {formData.description && (
                <p className="mt-4 text-gray-600 italic">
                  {formData.description}
                </p>
              )}
            </div>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
            <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500 text-center">
              <p className="font-medium">
                © {new Date().getFullYear()} Your Company
              </p>
              <p>All rights reserved. This document is legally binding.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode - Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-6 pb-3 border-b">
                  Basic Information
                </h2>

                <div className="space-y-5">
                  {/* Policy Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 ${
                        errors.title || validationErrors.title
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g., Privacy Policy for My Company"
                    />
                    {(errors.title || validationErrors.title) && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.title || validationErrors.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.title.length}/200 characters
                    </p>
                  </div>

                  {/* Policy Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {policyTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            handleTypeChange({ target: { value: type.value } });
                            handleQuickFill(type.value);
                          }}
                          className={`p-3 border rounded-lg text-center transition duration-300 ${
                            formData.type === type.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-lg mb-1">{type.icon}</div>
                          <div className="text-xs font-medium">
                            {type.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    {(errors.type || validationErrors.type) && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.type || validationErrors.type}
                      </p>
                    )}
                  </div>

                  {/* Version */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="version"
                      value={formData.version}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300 ${
                        errors.version || validationErrors.version
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="1.0.0"
                    />
                    {(errors.version || validationErrors.version) && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.version || validationErrors.version}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Use semantic versioning (major.minor.patch)
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() =>
                            handleChange({
                              target: { name: "status", value: status.value },
                            })
                          }
                          className={`p-2 border rounded-lg text-center transition duration-300 ${
                            formData.status === status.value
                              ? `${status.color} border-transparent`
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="text-xs font-medium">
                            {status.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Effective Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date
                    </label>
                    <div className="relative">
                      <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="effectiveDate"
                        value={formData.effectiveDate}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-300"
                      placeholder="Brief description of this policy..."
                      maxLength="500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Requires Consent */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="requiresConsent"
                      id="requiresConsent"
                      checked={formData.requiresConsent}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="requiresConsent"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Requires user consent
                    </label>
                    <FaInfoCircle
                      className="ml-2 text-gray-400"
                      title="Users will need to accept this policy"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Quick Tips
                </h3>
                <ul className="space-y-3 text-sm text-blue-700">
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Use clear, simple language that users can understand
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Include all required legal disclosures for your
                      jurisdiction
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Update version number when making significant changes
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      Set to "Published" only when ready for users to see
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FaCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>Test the policy preview before publishing</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Content Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        Policy Content <span className="text-red-500">*</span>
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Write your policy content using the rich text editor
                        below
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{wordCount} words</span>
                      {" • "}
                      <span>{characterCount} characters</span>
                    </div>
                  </div>
                  {(errors.content || validationErrors.content) && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.content || validationErrors.content}
                    </p>
                  )}
                </div>
                <div className="p-4">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={quillModules}
                    formats={quillFormats}
                    className="h-96 mb-16"
                    placeholder="Start writing your policy content here... You can use headings, lists, links, and more."
                  />
                </div>
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="text-sm text-gray-500">
                      <p>
                        <span className="font-medium">Tip:</span> Use the
                        preview button to see how your policy will look to users
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => navigate("/policies")}
                        className="px-4 py-2 border border-gray-300 rounded-lg flex items-center hover:bg-gray-50 transition duration-300"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            Create Policy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Choose a Template
                </h3>
                <p className="text-gray-600">
                  Start with a pre-written template for common policy types
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policyTypes
                .filter((type) => type.value !== "other")
                .map((type) => (
                  <div
                    key={type.value}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition duration-300 cursor-pointer"
                    onClick={() => loadTemplate(type.value)}
                  >
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-3">{type.icon}</div>
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {type.label}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Pre-written template
                        </p>
                      </div>
                    </div>
                    <button className="w-full mt-2 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition duration-300">
                      Use Template
                    </button>
                  </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start">
                <FaInfoCircle className="text-gray-400 mr-2 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Templates provide a starting point. Remember to customize all
                  placeholder text (like [Your Company]) with your specific
                  information.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPolicy;
