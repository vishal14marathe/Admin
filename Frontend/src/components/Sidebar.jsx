import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaChartBar,
  FaCog,
  FaShoppingCart,
  FaFileAlt,
  FaFileContract,
  FaBell,
} from "react-icons/fa";

const Sidebar = () => {
  const menuItems = [
    // { icon: <FaTachometerAlt />, label: "Dashboard", path: "/" },
    // { icon: <FaUsers />, label: "Users", path: "/users" },
    // { icon: <FaShoppingCart />, label: "Products", path: "/products" },
    { icon: <FaFileContract />, label: "Policies", path: "/policies" },
    // { icon: <FaChartBar />, label: "Analytics", path: "/analytics" },
    // { icon: <FaFileAlt />, label: "Reports", path: "/reports" },
    // { icon: <FaBell />, label: "Notifications", path: "/notifications" },
    // { icon: <FaCog />, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          Admin<span className="text-blue-400">Pro</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Dashboard v1.0</p>
      </div>

      <nav className="flex-1 px-4">
        <div className="mb-8">
          {/* <h3 className="text-gray-400 uppercase text-xs font-semibold px-3 mb-3">
            Main
          </h3> */}
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 rounded-lg transition duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {/* <h3 className="text-gray-400 uppercase text-xs font-semibold px-3 mb-3">
            Quick Links
          </h3> */}
          {/* <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition duration-300"
              >
                <span className="mr-3">📊</span>
                <span>Live Stats</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition duration-300"
              >
                <span className="mr-3">🔄</span>
                <span>Recent Activity</span>
              </a>
            </li>
          </ul> */}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="font-bold">A</span>
          </div>
          <div className="ml-3">
            <p className="font-medium">Admin User</p>
            <p className="text-sm text-gray-400">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
