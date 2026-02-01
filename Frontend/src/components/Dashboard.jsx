import { useState, useEffect } from "react";
import api from "../services/axios";
import {
  FaUsers,
  FaChartLine,
  FaShoppingCart,
  FaDollarSign,
  FaFileAlt,
  FaEye,
  FaEdit,
  FaCalendar,
} from "react-icons/fa";
import StatCard from "./StatCard";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPolicies, setRecentPolicies] = useState([]);
  const [policiesByType, setPoliciesByType] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentPolicies();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Try to fetch from dashboard stats endpoint
      const response = await api.get("/policies/dashboard/stats");

      if (response.data && response.data.data) {
        const data = response.data.data;
        setStats({
          totalPolicies: data.totalPolicies || 0,
          publishedPolicies: data.publishedPolicies || 0,
          draftPolicies: data.draftPolicies || 0,
          archivedPolicies: data.archivedPolicies || 0,
          summary: data.summary || {
            total: data.totalPolicies || 0,
            published: data.publishedPolicies || 0,
            draft: data.draftPolicies || 0,
            archived: data.archivedPolicies || 0,
          },
        });

        if (data.recentPolicies) {
          setRecentPolicies(data.recentPolicies);
        }

        if (data.policiesByType) {
          setPoliciesByType(data.policiesByType);
        }
      } else {
        // Fallback to summary endpoint
        await fetchSummaryStats();
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Fallback data
      await fetchSummaryStats();
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryStats = async () => {
    try {
      const response = await api.get("/policies/stats/summary");
      if (response.data && response.data.data) {
        const data = response.data.data;
        setStats({
          totalPolicies: data.summary?.totalPolicies || 0,
          publishedPolicies: data.summary?.totalPublished || 0,
          draftPolicies:
            data.byType?.reduce((acc, type) => acc + (type.draft || 0), 0) || 0,
          archivedPolicies:
            data.byType?.reduce((acc, type) => acc + (type.archived || 0), 0) ||
            0,
          summary: {
            total: data.summary?.totalPolicies || 0,
            published: data.summary?.totalPublished || 0,
            draft:
              data.byType?.reduce((acc, type) => acc + (type.draft || 0), 0) ||
              0,
            archived:
              data.byType?.reduce(
                (acc, type) => acc + (type.archived || 0),
                0,
              ) || 0,
          },
        });

        // Transform policies by type for display
        if (data.byType) {
          const transformedTypes = data.byType.map((type) => ({
            _id: type._id,
            count: type.total || 0,
            published: type.published || 0,
            label: type._id
              ? type._id
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : "Unknown",
          }));
          setPoliciesByType(transformedTypes);
        }
      }
    } catch (error) {
      console.error("Error fetching summary stats:", error);
      // Use fallback data
      setStats({
        totalPolicies: 0,
        publishedPolicies: 0,
        draftPolicies: 0,
        archivedPolicies: 0,
        summary: {
          total: 0,
          published: 0,
          draft: 0,
          archived: 0,
        },
      });
    }
  };

  const fetchRecentPolicies = async () => {
    try {
      const response = await api.get("/policies/recent/list");
      if (response.data && response.data.data && response.data.data.policies) {
        setRecentPolicies(response.data.data.policies);
      }
    } catch (error) {
      console.error("Error fetching recent policies:", error);
    }
  };

  const statCards = [
    {
      title: "Total Policies",
      value: stats?.totalPolicies || 0,
      icon: <FaFileAlt className="text-2xl" />,
      change: "+5%",
      trend: "up",
      color: "bg-blue-500",
    },
    {
      title: "Published",
      value: stats?.publishedPolicies || 0,
      icon: <FaEye className="text-2xl" />,
      change: "+12%",
      trend: "up",
      color: "bg-green-500",
    },
    {
      title: "Draft",
      value: stats?.draftPolicies || 0,
      icon: <FaEdit className="text-2xl" />,
      change: "+3%",
      trend: "up",
      color: "bg-yellow-500",
    },
    {
      title: "Archived",
      value: stats?.archivedPolicies || 0,
      icon: <FaCalendar className="text-2xl" />,
      change: "-2%",
      trend: "down",
      color: "bg-gray-500",
    },
  ];

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

  const getTypeBadge = (type) => {
    const typeColors = {
      terms_conditions:
        "bg-purple-100 text-purple-800 border border-purple-200",
      privacy_policy: "bg-blue-100 text-blue-800 border border-blue-200",
      client_policy: "bg-teal-100 text-teal-800 border border-teal-200",
      refund_policy: "bg-green-100 text-green-800 border border-green-200",
      shipping_policy: "bg-orange-100 text-orange-800 border border-orange-200",
      cancellation_policy: "bg-red-100 text-red-800 border border-red-200",
    };

    const displayType = type
      ? type
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "Unknown";

    return (
      <span
        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[type] || "bg-gray-100 text-gray-800 border border-gray-200"}`}
      >
        {displayType}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: {
        color: "bg-green-100 text-green-800 border border-green-200",
        label: "Published",
      },
      draft: {
        color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        label: "Draft",
      },
      archived: {
        color: "bg-gray-100 text-gray-800 border border-gray-200",
        label: "Archived",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your policies.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity and Policies by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Policies</h2>
            <Link
              to="/policies"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {recentPolicies.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
              <FaFileAlt className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500">No recent policies</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first policy to get started
              </p>
              <Link
                to="/policies/new"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Create Policy
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPolicies.slice(0, 5).map((policy) => (
                    <tr
                      key={policy._id || policy.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-xs">
                          {policy.title}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getTypeBadge(policy.type)}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(policy.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(policy.updatedAt || policy.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Link
                            to={`/policies/${policy._id || policy.id}/view`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition duration-300"
                            title="View"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/policies/${policy._id || policy.id}/edit`}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition duration-300"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Policies by Type
          </h2>
          <div className="space-y-4">
            {policiesByType.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaFileAlt className="text-3xl mx-auto mb-2 text-gray-300" />
                <p>No policy types data</p>
              </div>
            ) : (
              policiesByType.map((typeStat) => (
                <div
                  key={typeStat._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <FaFileAlt className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {typeStat.label || typeStat._id}
                      </p>
                      <p className="text-sm text-gray-600">
                        {typeStat.published || 0} published •{" "}
                        {typeStat.count || 0} total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{typeStat.count || 0}</p>
                    <p className="text-xs text-green-600">
                      {Math.round(
                        ((typeStat.published || 0) / (typeStat.count || 1)) *
                          100,
                      )}
                      % published
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Stats Summary */}
          {stats && stats.summary && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">Total Policies</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {stats.summary.total}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-700">Published</p>
                  <p className="text-2xl font-bold text-green-800">
                    {stats.summary.published}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700">Draft</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {stats.summary.draft}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">Archived</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.summary.archived}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/policies/new"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-300 text-center border border-blue-100"
          >
            <div className="text-blue-600 font-medium">Create Policy</div>
            <div className="text-sm text-gray-600 mt-1">
              Create new policy document
            </div>
          </Link>
          <Link
            to="/policies"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition duration-300 text-center border border-green-100"
          >
            <div className="text-green-600 font-medium">Manage Policies</div>
            <div className="text-sm text-gray-600 mt-1">
              View and manage all policies
            </div>
          </Link>
          <button
            onClick={fetchDashboardStats}
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition duration-300 text-center border border-purple-100"
          >
            <div className="text-purple-600 font-medium">Refresh Stats</div>
            <div className="text-sm text-gray-600 mt-1">
              Update dashboard data
            </div>
          </button>
          <Link
            to="/policies?status=draft"
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition duration-300 text-center border border-orange-100"
          >
            <div className="text-orange-600 font-medium">Review Drafts</div>
            <div className="text-sm text-gray-600 mt-1">
              {stats?.draftPolicies || 0} draft policies
            </div>
          </Link>
        </div>
      </div>

      {/* Policy Health Status */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Policy Health Status
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Published Policies
              </span>
              <span className="text-sm font-medium text-gray-700">
                {stats?.publishedPolicies || 0} / {stats?.totalPolicies || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{
                  width: `${stats?.totalPolicies ? ((stats.publishedPolicies || 0) / stats.totalPolicies) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Draft Policies
              </span>
              <span className="text-sm font-medium text-gray-700">
                {stats?.draftPolicies || 0} / {stats?.totalPolicies || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-yellow-500 h-2.5 rounded-full"
                style={{
                  width: `${stats?.totalPolicies ? ((stats.draftPolicies || 0) / stats.totalPolicies) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">
                {stats?.totalPolicies || 0}
              </p>
              <p className="text-sm text-gray-600">Total Policies</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">
                {policiesByType.length}
              </p>
              <p className="text-sm text-gray-600">Policy Types</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
