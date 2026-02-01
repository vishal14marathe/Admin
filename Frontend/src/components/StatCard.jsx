import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const StatCard = ({ title, value, icon, change, trend, color }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            <span
              className={`flex items-center text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trend === "up" ? (
                <FaArrowUp className="mr-1" />
              ) : (
                <FaArrowDown className="mr-1" />
              )}
              {change}
            </span>
            <span className="text-gray-500 text-sm ml-2">from last month</span>
          </div>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
