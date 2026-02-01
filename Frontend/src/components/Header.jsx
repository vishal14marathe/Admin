import { FaSearch, FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useState } from "react";

const Header = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState(3);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <FaBell className="text-xl" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
            >
              <FaUserCircle className="text-2xl text-gray-600" />
              <div className="text-left hidden md:block">
                <p className="font-medium text-sm">
                  {user?.username || "Admin"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role || "Administrator"}
                </p>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </a>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
