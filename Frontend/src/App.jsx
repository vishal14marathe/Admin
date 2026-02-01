import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";

import Login from "./components/Login";
import Policies from "./components/Policies";
import ViewPolicy from "./components/policies/ViewPolicy";
import EditPolicy from "./components/policies/EditPolicy";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        // Validate that userData is valid JSON
        const parsedUser = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={user} onLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/policies/new" element={<EditPolicy />} />
              <Route path="/policies/:id/view" element={<ViewPolicy />} />
              <Route path="/policies/:id/edit" element={<EditPolicy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
