import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/axios";

import {
  FaArrowLeft,
  FaEdit,
  FaEye,
  FaCopy,
  FaDownload,
  FaCalendar,
  FaUser,
  FaTag,
  FaGlobe,
  FaCheckCircle,
  FaFileAlt,
  FaPrint,
  FaShare,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ViewPolicy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copying, setCopying] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPolicy();
      incrementViewCount();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/policies/${id}`);

      if (response.data && response.data.data && response.data.data.policy) {
        setPolicy(response.data.data.policy);
        setViewCount(response.data.data.policy.views || 0);
      } else {
        setError("Policy not found or invalid response");
      }
    } catch (err) {
      console.error("Error fetching policy:", err);
      setError(err.response?.data?.message || "Failed to load policy");
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await api.patch(`/policies/${id}/views`);
    } catch (err) {
      console.error("Error incrementing view count:", err);
    }
  };

  const handleCopyLink = async () => {
    try {
      setCopying(true);
      const policyLink = `${window.location.origin}/policies/${policy.slug || id}`;
      await navigator.clipboard.writeText(policyLink);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    } finally {
      setCopying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `
      Policy: ${policy?.title}
      Type: ${policy?.type}
      Status: ${policy?.status}
      Language: ${policy?.language}
      Last Updated: ${new Date(policy?.updatedAt).toLocaleDateString()}
      
      CONTENT:
      ${policy?.content}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${policy?.slug || "policy"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Policy downloaded successfully!");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeDisplay = (type) => {
    return (
      type
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || type
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        color: "bg-green-100 text-green-800 border border-green-200",
        label: "Published",
        icon: <FaCheckCircle className="inline mr-1" />,
      },
      draft: {
        color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        label: "Draft",
        icon: <FaFileAlt className="inline mr-1" />,
      },
      archived: {
        color: "bg-gray-100 text-gray-800 border border-gray-200",
        label: "Archived",
        icon: <FaFileAlt className="inline mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Policy
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Policy Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested policy could not be found.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition duration-300"
              >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </Link>
              <div className="hidden md:block">
                {getStatusBadge(policy.status)}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
              <button
                onClick={handleCopyLink}
                disabled={copying}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
              >
                <FaShare className="mr-2" />
                {copying ? "Copying..." : "Share"}
              </button>
              <Link
                to={`/policies/${id}/edit`}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
              >
                <FaEdit className="mr-2" />
                Edit
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="lg:w-2/3">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {policy.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
                  <div className="flex items-center">
                    <FaTag className="mr-2" />
                    <span className="font-medium">Type:</span>
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {getTypeDisplay(policy.type)}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <FaGlobe className="mr-2" />
                    <span className="font-medium">Language:</span>
                    <span className="ml-2 uppercase">{policy.language}</span>
                  </div>

                  <div className="flex items-center">
                    <FaEye className="mr-2" />
                    <span className="font-medium">Views:</span>
                    <span className="ml-2">{viewCount}</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3 lg:pl-8 lg:border-l lg:border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Quick Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FaCalendar className="mr-3 flex-shrink-0" />
                    <div>
                      <div className="text-sm">Created</div>
                      <div className="font-medium">
                        {formatDate(policy.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <FaCalendar className="mr-3 flex-shrink-0" />
                    <div>
                      <div className="text-sm">Last Updated</div>
                      <div className="font-medium">
                        {formatDate(policy.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {policy.publishedAt && (
                    <div className="flex items-center text-gray-600">
                      <FaCalendar className="mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm">Published</div>
                        <div className="font-medium">
                          {formatDate(policy.publishedAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <FaUser className="mr-3 flex-shrink-0" />
                    <div>
                      <div className="text-sm">Last Updated By</div>
                      <div className="font-medium">
                        {policy.lastUpdatedBy?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.lastUpdatedBy?.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policy Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Policy Content
                </h2>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Last updated: {formatDate(policy.updatedAt)}
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center text-blue-600 hover:text-blue-800 transition duration-300"
                  >
                    <FaDownload className="mr-2" />
                    Download as TXT
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="prose max-w-none">
                  {policy.content.split("\n").map((paragraph, index) => (
                    <p
                      key={index}
                      className="mb-4 text-gray-700 leading-relaxed"
                    >
                      {paragraph || <br />}
                    </p>
                  ))}
                </div>

                {policy.keywords && policy.keywords.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {policy.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Policy Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${policy.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {policy.isActive ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    v1.0
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to={`/policies/${id}/history`}
                    className="flex items-center text-blue-600 hover:text-blue-800 transition duration-300"
                  >
                    <FaCopy className="mr-2" />
                    View Version History
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to={`/policies/${id}/edit`}
                  className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  <FaEdit className="mr-2" />
                  Edit Policy
                </Link>

                <Link
                  to={`/policies/${id}/duplicate`}
                  className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
                >
                  <FaCopy className="mr-2" />
                  Duplicate Policy
                </Link>

                <button
                  onClick={() => navigate(`/policies?type=${policy.type}`)}
                  className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
                >
                  <FaFileAlt className="mr-2" />
                  View Similar Policies
                </button>
              </div>
            </div>

            {/* SEO Preview */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                SEO Preview
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium">URL Slug:</p>
                <p className="bg-gray-50 p-2 rounded border border-gray-200 font-mono break-all">
                  /policies/{policy.slug || id}
                </p>
                <p className="text-xs mt-2">
                  Use this slug to reference this policy in your website.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            <p>Policy ID: {policy._id}</p>
          </div>

          <div className="flex space-x-3">
            <Link
              to="/dashboard"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300"
            >
              Close
            </Link>
            <Link
              to={`/policies/${id}/edit`}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
            >
              Edit Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style media="print">
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              background: white !important;
            }
            
            .print-content {
              display: block !important;
            }
            
            .prose p {
              margin-bottom: 1em;
              line-height: 1.6;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ViewPolicy;
