import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/axios";
import {
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaEye,
  FaCopy,
  FaFileAlt,
  FaCalendar,
  FaUser,
  FaTag,
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { toast } from "react-toastify";

const EditPolicy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [originalPolicy, setOriginalPolicy] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Policy types configuration
  const policyTypes = [
    { value: "terms_conditions", label: "Terms & Conditions" },
    { value: "privacy_policy", label: "Privacy Policy" },
    { value: "client_policy", label: "Client Policy" },
    { value: "refund_policy", label: "Refund Policy" },
    { value: "shipping_policy", label: "Shipping Policy" },
    { value: "cancellation_policy", label: "Cancellation Policy" },
    { value: "cookie_policy", label: "Cookie Policy" },
    { value: "return_policy", label: "Return Policy" },
    { value: "disclaimer", label: "Disclaimer" },
    { value: "eula", label: "End User License Agreement" },
  ];

  // Status options
  const statusOptions = [
    { value: "draft", label: "Draft", color: "bg-yellow-100 text-yellow-800" },
    {
      value: "published",
      label: "Published",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "archived",
      label: "Archived",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  // Language options
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
    { value: "ar", label: "Arabic" },
    { value: "hi", label: "Hindi" },
  ];

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    type: "privacy_policy",
    status: "draft",
    language: "en",
    isActive: true,
    keywords: [],
    metaDescription: "",
  });

  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (id) {
      fetchPolicy();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    checkForChanges();
  }, [formData, originalPolicy]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/policies/${id}`);

      if (response.data && response.data.data && response.data.data.policy) {
        const policyData = response.data.data.policy;
        setPolicy(policyData);
        setOriginalPolicy(policyData);

        setFormData({
          title: policyData.title || "",
          slug: policyData.slug || "",
          content: policyData.content || "",
          type: policyData.type || "privacy_policy",
          status: policyData.status || "draft",
          language: policyData.language || "en",
          isActive:
            policyData.isActive !== undefined ? policyData.isActive : true,
          keywords: policyData.keywords || [],
          metaDescription: policyData.metaDescription || "",
        });
      } else {
        setError("Policy not found");
      }
    } catch (err) {
      console.error("Error fetching policy:", err);
      setError(err.response?.data?.message || "Failed to load policy");
      toast.error("Failed to load policy");
    } finally {
      setLoading(false);
    }
  };

  const checkForChanges = () => {
    if (!originalPolicy) {
      setHasChanges(false);
      return;
    }

    const hasChanged = Object.keys(formData).some((key) => {
      if (key === "keywords") {
        return (
          JSON.stringify(formData.keywords) !==
          JSON.stringify(originalPolicy.keywords || [])
        );
      }
      return formData[key] !== originalPolicy[key];
    });

    setHasChanges(hasChanged);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate slug from title
    if (name === "title" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleTextareaChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeywordAdd = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()],
      }));
      setNewKeyword("");
    }
  };

  const handleKeywordRemove = (keyword) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const handleKeywordKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleKeywordAdd();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        title: formData.title.trim(),
        slug: formData.slug.trim() || generateSlug(formData.title),
        content: formData.content.trim(),
      };

      let response;

      if (id) {
        // Update existing policy - use PATCH instead of PUT
        response = await api.patch(`/policies/${id}`, payload);
      } else {
        // Create new policy
        response = await api.post("/policies", payload);
      }

      if (response.data && response.data.data) {
        toast.success(`Policy ${id ? "updated" : "created"} successfully!`);
        setOriginalPolicy(response.data.data.policy || payload);
        setHasChanges(false);

        if (!id) {
          // Navigate to edit page for new policy
          navigate(`/policies/${response.data.data.policy._id}/edit`);
        }
      }
    } catch (err) {
      console.error("Error saving policy:", err);
      toast.error(err.response?.data?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const handleReset = () => {
    if (originalPolicy) {
      setFormData({
        title: originalPolicy.title || "",
        slug: originalPolicy.slug || "",
        content: originalPolicy.content || "",
        type: originalPolicy.type || "privacy_policy",
        status: originalPolicy.status || "draft",
        language: originalPolicy.language || "en",
        isActive:
          originalPolicy.isActive !== undefined
            ? originalPolicy.isActive
            : true,
        keywords: originalPolicy.keywords || [],
        metaDescription: originalPolicy.metaDescription || "",
      });
      toast.info("Form reset to original values");
    }
  };

  const handlePublish = async () => {
    if (!formData.content.trim()) {
      toast.error("Content is required for publishing");
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/policies/${id}/publish`, {
        status: "published",
      });

      if (response.data && response.data.data) {
        setFormData((prev) => ({ ...prev, status: "published" }));
        toast.success("Policy published successfully!");
        setHasChanges(true);
      }
    } catch (err) {
      console.error("Error publishing policy:", err);
      toast.error(err.response?.data?.message || "Failed to publish policy");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this policy?")) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/policies/${id}/archive`, {
        status: "archived",
      });

      if (response.data && response.data.data) {
        setFormData((prev) => ({ ...prev, status: "archived" }));
        toast.success("Policy archived successfully!");
        setHasChanges(true);
      }
    } catch (err) {
      console.error("Error archiving policy:", err);
      toast.error(err.response?.data?.message || "Failed to archive policy");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setSaving(true);
      const response = await api.post(`/policies/${id}/duplicate`);

      if (response.data && response.data.data) {
        toast.success("Policy duplicated successfully!");
        navigate(`/policies/${response.data.data.policy._id}/edit`);
      }
    } catch (err) {
      console.error("Error duplicating policy:", err);
      toast.error(err.response?.data?.message || "Failed to duplicate policy");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (error && !policy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Policy
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Go Back
            </button>
            <button
              onClick={fetchPolicy}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                to={id ? `/policies/${id}/view` : "/dashboard"}
                className="flex items-center text-gray-600 hover:text-gray-900 transition duration-300"
              >
                <FaArrowLeft className="mr-2" />
                {id ? "Back to View" : "Back to Dashboard"}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? "Edit Policy" : "Create New Policy"}
              </h1>
            </div>

            {hasChanges && (
              <div className="flex items-center text-yellow-600">
                <FaExclamationTriangle className="mr-2" />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {policy && (
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(policy.createdAt)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{formatDate(policy.updatedAt)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="font-medium">{policy.views || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Last Updated By</p>
                  <p
                    className="font-medium truncate"
                    title={policy.lastUpdatedBy?.email}
                  >
                    {policy.lastUpdatedBy?.name || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Basic Information
                </h2>

                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Policy Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                      placeholder="Enter policy title"
                      required
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                        /policies/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                        placeholder="url-slug"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Used in the policy URL. Auto-generated from title if
                      empty.
                    </p>
                  </div>

                  {/* Type and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Policy Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                      >
                        {policyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Language and Active Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language *
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                      >
                        {languageOptions.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-4 pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">
                          Active Policy
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Card */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Policy Content *
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center text-blue-600 hover:text-blue-800 transition duration-300"
                  >
                    <FaEye className="mr-2" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>

                {showPreview ? (
                  <div className="border border-gray-300 rounded-lg p-6 min-h-[400px] bg-gray-50 overflow-auto">
                    <div className="prose max-w-none">
                      {formData.content.split("\n").map((paragraph, index) => (
                        <p
                          key={index}
                          className="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap"
                        >
                          {paragraph || <br />}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleTextareaChange}
                      rows={15}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                      placeholder="Enter policy content here..."
                      required
                    />
                    <div className="mt-3 flex justify-between text-sm text-gray-500">
                      <span>{formData.content.length} characters</span>
                      <span>
                        {
                          formData.content
                            .split(/\s+/)
                            .filter((w) => w.length > 0).length
                        }{" "}
                        words
                      </span>
                    </div>
                  </div>
                )}

                {/* Keywords */}
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={handleKeywordKeyPress}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                      placeholder="Add a keyword and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleKeywordAdd}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                      Add
                    </button>
                  </div>

                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleKeywordRemove(keyword)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Card */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  SEO Settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleTextareaChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                    placeholder="Enter meta description for search engines..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Recommended: 150-160 characters. Currently:{" "}
                    {formData.metaDescription.length}
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex flex-wrap gap-4 justify-between">
                  <div className="space-x-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <FaSave className="mr-2" />
                      {saving
                        ? "Saving..."
                        : id
                          ? "Save Changes"
                          : "Create Policy"}
                    </button>

                    {hasChanges && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300 flex items-center"
                      >
                        <FaUndo className="mr-2" />
                        Reset
                      </button>
                    )}

                    <Link
                      to={id ? `/policies/${id}/view` : "/dashboard"}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300 flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Cancel
                    </Link>
                  </div>

                  {id && (
                    <div className="space-x-3">
                      {formData.status !== "published" && (
                        <button
                          type="button"
                          onClick={handlePublish}
                          disabled={saving}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <FaCheckCircle className="mr-2" />
                          Publish Now
                        </button>
                      )}

                      {formData.status !== "archived" && (
                        <button
                          type="button"
                          onClick={handleArchive}
                          disabled={saving}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <FaFileAlt className="mr-2" />
                          Archive
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleDuplicate}
                        disabled={saving}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <FaCopy className="mr-2" />
                        Duplicate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Quick Preview
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium text-gray-800 truncate">
                    {formData.title || "No title"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {policyTypes.find((t) => t.value === formData.type)
                      ?.label || formData.type}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      statusOptions.find((s) => s.value === formData.status)
                        ?.color || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusOptions.find((s) => s.value === formData.status)
                      ?.label || formData.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">URL</p>
                  <p className="text-sm font-mono text-blue-600 break-all">
                    /policies/{formData.slug || "(no-slug)"}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to={`/policies/${id}/view`}
                    className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300"
                  >
                    <FaEye className="mr-2" />
                    View Live Policy
                  </Link>
                </div>
              </div>
            </div>

            {/* Content Stats */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Content Statistics
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Characters</span>
                  <span className="font-medium">{formData.content.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Words</span>
                  <span className="font-medium">
                    {
                      formData.content.split(/\s+/).filter((w) => w.length > 0)
                        .length
                    }
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Paragraphs</span>
                  <span className="font-medium">
                    {
                      formData.content
                        .split("\n")
                        .filter((p) => p.trim().length > 0).length
                    }
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Keywords</span>
                  <span className="font-medium">
                    {formData.keywords.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            {id && (
              <div className="bg-red-50 border border-red-200 rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-red-800 mb-4">
                  Danger Zone
                </h3>

                <div className="space-y-3">
                  <p className="text-sm text-red-600">
                    These actions are irreversible. Please proceed with caution.
                  </p>

                  <button
                    type="button"
                    onClick={handleArchive}
                    className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition duration-300 flex items-center justify-center"
                  >
                    <FaFileAlt className="mr-2" />
                    {formData.status === "archived"
                      ? "Unarchive Policy"
                      : "Archive Policy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this policy? This action cannot be undone.",
                        )
                      ) {
                        // Handle delete
                        toast.info("Delete functionality to be implemented");
                      }
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center"
                  >
                    <FaTrash className="mr-2" />
                    Delete Policy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-md animate-pulse">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">
                You have unsaved changes
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Don't forget to save your changes before leaving.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPolicy;
