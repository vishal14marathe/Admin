import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
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
} from "react-icons/fa";

const PolicyList = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchPolicies();
    fetchPolicyStats();
  }, [filters]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      params.append("page", filters.page);
      params.append("limit", filters.limit);

      const response = await axios.get(`/api/policies?${params}`, {
        headers: { "x-auth-token": token },
      });

      setPolicies(response.data.policies);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/policies/types/count", {
        headers: { "x-auth-token": token },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching policy stats:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/policies/${id}`, {
        headers: { "x-auth-token": token },
      });
      fetchPolicies();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting policy:", error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        color: "bg-green-100 text-green-800",
        icon: <FaCheckCircle />,
      },
      draft: { color: "bg-yellow-100 text-yellow-800", icon: <FaClock /> },
      archived: { color: "bg-gray-100 text-gray-800", icon: <FaArchive /> },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <span className="mr-1">{config.icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      privacy: "bg-blue-100 text-blue-800",
      terms: "bg-purple-100 text-purple-800",
      cookies: "bg-orange-100 text-orange-800",
      refund: "bg-red-100 text-red-800",
      shipping: "bg-teal-100 text-teal-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${typeColors[type] || typeColors.other}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Policies</h1>
          <p className="text-gray-600">
            Manage your website policies and terms
          </p>
        </div>
        <Link
          to="/policies/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition duration-300"
        >
          <FaPlus className="mr-2" />
          New Policy
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">
                  {stat._id.toUpperCase()}
                </p>
                <p className="text-2xl font-bold mt-1">{stat.count}</p>
                <p className="text-xs text-green-600">
                  {stat.published} published
                </p>
              </div>
              <FaFileAlt className="text-2xl text-blue-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchPolicies()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex space-x-4">
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value, page: 1 })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Types</option>
              <option value="privacy">Privacy Policy</option>
              <option value="terms">Terms of Service</option>
              <option value="cookies">Cookie Policy</option>
              <option value="refund">Refund Policy</option>
              <option value="shipping">Shipping Policy</option>
              <option value="other">Other</option>
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
              onClick={fetchPolicies}
              className="bg-gray-100 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 transition duration-300"
            >
              <FaSync className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
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
                      Version
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
                          Create your first policy to get started
                        </p>
                      </td>
                    </tr>
                  ) : (
                    policies.map((policy) => (
                      <tr key={policy._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {policy.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Created by{" "}
                              {policy.createdBy?.username || "Unknown"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getTypeBadge(policy.type)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(policy.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          v{policy.version}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(policy.lastUpdated)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link
                              to={`/policies/${policy._id}/view`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-300"
                              title="View"
                            >
                              <FaEye />
                            </Link>
                            <Link
                              to={`/policies/${policy._id}/edit`}
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                  {Math.min(filters.page * filters.limit, pagination.total)} of{" "}
                  {pagination.total} policies
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page - 1 })
                    }
                    disabled={filters.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() =>
                            setFilters({ ...filters, page: pageNum })
                          }
                          className={`px-3 py-1 rounded-lg ${
                            filters.page === pageNum
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                  <button
                    onClick={() =>
                      setFilters({ ...filters, page: filters.page + 1 })
                    }
                    disabled={filters.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{policyToDelete?.title}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(policyToDelete._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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

export default PolicyList;
