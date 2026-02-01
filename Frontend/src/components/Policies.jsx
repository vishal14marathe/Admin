import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/axios";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFileAlt,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaArchive,
  FaExclamationTriangle,
} from "react-icons/fa";

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState(null);
  const [policyTypes, setPolicyTypes] = useState([]);

  useEffect(() => {
    fetchPolicies();
    fetchPolicyStats();
    fetchPolicyTypes();
  }, [filters]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      params.append("page", filters.page);
      params.append("limit", filters.limit);

      console.log("Fetching policies with params:", params.toString());

      const response = await api.get(`/policies?${params}`);

      console.log("API Response:", response.data);

      // FIXED: Your backend returns data in response.data.data.policies
      if (response.data && response.data.data && response.data.data.policies) {
        setPolicies(response.data.data.policies);
        setPagination({
          total: response.data.total || response.data.data.policies.length,
          page: response.data.currentPage || filters.page,
          pages: response.data.totalPages || 1,
          limit: response.data.limit || filters.limit,
        });
      } else {
        console.warn("Unexpected API response structure:", response.data);
        setPolicies([]);
        setPagination({});
      }
    } catch (err) {
      console.error("Error fetching policies:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch policies. Please check your connection and try again.",
      );
      setPolicies([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyStats = async () => {
    try {
      const response = await api.get("/policies/stats/summary");
      if (response.data && response.data.data && response.data.data.byType) {
        // Transform the stats data
        const transformedStats = response.data.data.byType.map((stat) => ({
          _id: stat._id,
          count: stat.total || 0,
          published: stat.published || 0,
          draft: stat.draft || 0,
          archived: stat.archived || 0,
        }));
        setStats(transformedStats);
      }
    } catch (err) {
      console.error("Error fetching policy stats:", err);
      // Mock stats for development
      setStats([
        { _id: "privacy_policy", count: 0, published: 0 },
        { _id: "terms_conditions", count: 0, published: 0 },
        { _id: "refund_policy", count: 0, published: 0 },
      ]);
    }
  };

  const fetchPolicyTypes = async () => {
    try {
      const response = await api.get("/policies/types/list");
      if (
        response.data &&
        response.data.data &&
        response.data.data.policyTypes
      ) {
        setPolicyTypes(response.data.data.policyTypes);
      }
    } catch (err) {
      console.error("Error fetching policy types:", err);
      // Default types
      setPolicyTypes([
        { value: "terms_conditions", label: "Terms & Conditions" },
        { value: "privacy_policy", label: "Privacy Policy" },
        {
          value: "client_policy",
          label: "Client Consent and Terms & Conditions",
        },
        { value: "code_of_conduct", label: "Code Of Conduct" },
        { value: "investor_charter", label: "Investor Charter" },
        { value: "redressal_of_grievance", label: "Redressal Of Grievance" },
        {
          value: "disclosure_user_kyc_agreement",
          label: "Disclosure User & Kyc Agreement",
        },

        { value: "complaints_board", label: "Complaints Board" },

        { value: "pmla_policy", label: "PMLA Policy" },

        { value: "disclaimer_for_website", label: "Disclaimer For Website" },

        { value: "social_media_disclosure", label: "Social_Media_Disclosure" },

        { value: "legal_risk_disclosure", label: "Legal Risk Disclosure" },

        { value: "refund_policy", label: "Refund Policy" },

        { value: "cancellation_policy", label: "Cancellation Policy" },

        {
          value: "internal_policy_on_onflict_of_interest",
          label: "Internal Policy On Conflict Of Interest",
        },
        { value: "pro_points_policy", label: "Pro Points Policy" },
        {
          value: "data_deletion_account_removal_policy",
          label: "Cancellation Policy",
        },
      ]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/policies/${id}`);
      fetchPolicies();
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error deleting policy:", err);
      alert(
        err.response?.data?.message ||
          "Failed to delete policy. Please try again.",
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        color: "bg-green-100 text-green-800 border border-green-200",
        icon: <FaCheckCircle className="inline mr-1" />,
      },
      draft: {
        color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        icon: <FaClock className="inline mr-1" />,
      },
      archived: {
        color: "bg-gray-100 text-gray-800 border border-gray-200",
        icon: <FaArchive className="inline mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeMapping = {
      terms_conditions: {
        color: "bg-purple-100 text-purple-800 border border-purple-200",
        label: "Terms & Conditions",
      },
      privacy_policy: {
        color: "bg-blue-100 text-blue-800 border border-blue-200",
        label: "Privacy Policy",
      },
      client_policy: {
        color: "bg-teal-100 text-teal-800 border border-teal-200",
        label: "Client Policy",
      },
      refund_policy: {
        color: "bg-green-100 text-green-800 border border-green-200",
        label: "Refund Policy",
      },
      shipping_policy: {
        color: "bg-orange-100 text-orange-800 border border-orange-200",
        label: "Shipping Policy",
      },
      cancellation_policy: {
        color: "bg-red-100 text-red-800 border border-red-200",
        label: "Cancellation Policy",
      },
    };

    const config = typeMapping[type] || {
      color: "bg-gray-100 text-gray-800 border border-gray-200",
      label: type
        ? type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "Unknown",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Policy Management
          </h1>
          <p className="text-gray-600">
            Create, manage, and publish your website policies
          </p>
        </div>
        <Link
          to="/policies/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300"
        >
          <FaPlus className="mr-2" />
          Add Policy
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <FaExclamationTriangle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">
              Make sure your backend server is running on http://localhost:5000
            </p>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={fetchPolicies}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded"
              >
                Re-login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">
                  {stat._id
                    ? stat._id
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")
                    : "Unknown"}
                </p>
                <p className="text-2xl font-bold mt-1">{stat.count || 0}</p>
                <p className="text-xs text-green-600">
                  {stat.published || 0} published
                </p>
              </div>
              <FaFileAlt className="text-2xl text-blue-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search policies by title or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value, page: 1 })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">All Types</option>
                {policyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value, page: 1 })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300"
              >
                <FaSearch className="mr-2" />
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilters({
                    type: "",
                    status: "",
                    page: 1,
                    limit: 10,
                  });
                }}
                className="bg-gray-100 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 transition duration-300"
              >
                <FaSync className="mr-2" />
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FaFileAlt className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No policies found</p>
                    <p className="text-sm">
                      {search || filters.type || filters.status
                        ? "Try adjusting your search or filters"
                        : "Create your first policy to get started"}
                    </p>
                    {!(search || filters.type || filters.status) && (
                      <Link
                        to="/policies/new"
                        className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                      >
                        <FaPlus className="inline mr-2" />
                        Add New Policy
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr
                    key={policy._id || policy.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          to={`/policies/${policy._id || policy.id}/view`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200 block"
                        >
                          {policy.title}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {policy.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(policy.type)}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(policy.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(policy.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(policy.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          to={`/policies/${policy._id || policy.id}/view`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-300"
                          title="View"
                        >
                          <FaEye />
                        </Link>
                        <Link
                          to={`/policies/${policy._id || policy.id}/edit`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition duration-300"
                          title="Edit"
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => {
                            setPolicyToDelete(policy);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-300"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500">
              Showing {(filters.page - 1) * filters.limit + 1} to{" "}
              {Math.min(filters.page * filters.limit, pagination.total)} of{" "}
              {pagination.total} policies
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setFilters({ ...filters, page: filters.page - 1 })
                }
                disabled={filters.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-300"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setFilters({ ...filters, page: pageNum })}
                    className={`px-3 py-1 rounded-lg transition duration-300 ${
                      filters.page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
                disabled={filters.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Confirm Delete
              </h3>
              <p className="text-gray-600">
                Are you sure you want to delete "
                <span className="font-semibold">{policyToDelete?.title}</span>"?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDelete(policyToDelete._id || policyToDelete.id)
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;
