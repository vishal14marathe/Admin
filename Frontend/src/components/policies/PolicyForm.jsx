// src/components/policies/PolicyForm.jsx
import { useState, useEffect } from "react";
import {
  FaSave,
  FaTimes,
  FaEye,
  FaFileAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

const PolicyForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  mode = "edit",
}) => {
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "privacy_policy",
    status: "draft",
    language: "en",
    isActive: true,
    keywords: [],
    metaDescription: "",
    ...initialData,
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Policy types
  const policyTypes = [
    { value: "terms_conditions", label: "Terms & Conditions" },
    { value: "privacy_policy", label: "Privacy Policy" },
    { value: "client_policy", label: "Client Policy" },
    { value: "refund_policy", label: "Refund Policy" },
    { value: "shipping_policy", label: "Shipping Policy" },
    { value: "cancellation_policy", label: "Cancellation Policy" },
  ];

  // Status options
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ];

  useEffect(() => {
    // Check if form data has changed from initial
    const hasChanged = Object.keys(formData).some((key) => {
      return JSON.stringify(formData[key]) !== JSON.stringify(initialData[key]);
    });
    setHasChanges(hasChanged);
  }, [formData, initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleContentChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      content: e.target.value,
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Basic Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter policy title"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Content *</h2>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaEye className="mr-2" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>

        {showPreview ? (
          <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] bg-gray-50">
            <div className="prose max-w-none whitespace-pre-wrap">
              {formData.content}
            </div>
          </div>
        ) : (
          <div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter policy content..."
              required
            />
            <div className="mt-2 text-sm text-gray-500">
              {formData.content.length} characters
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          {hasChanges && (
            <div className="flex items-center text-yellow-600">
              <FaExclamationTriangle className="mr-2" />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FaSave className="mr-2" />
              {mode === "edit" ? "Save Changes" : "Create Policy"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PolicyForm;
