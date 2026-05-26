import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { authService, initiateSocketConnection, disconnectSocket } from "./services/api";

import Navbar from "./components/Navbar";
import NotificationToast from "./components/NotificationToast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FraudDetection from "./pages/FraudDetection";
import ScamAnalyzer from "./pages/ScamAnalyzer";
import NotFound from "./pages/NotFound";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("vyom_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authService.getMe();
        setUser(data.user);
        initiateSocketConnection(data.user._id);
      } catch (err) {
        localStorage.removeItem("vyom_token");
        disconnectSocket();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    initiateSocketConnection(userData._id);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app-loader">
        <div className="spinner"></div>
        <p>Initializing Vyom Security Shield...</p>
      </div>
    );
  }

  // Define route protections
  const isAuthRoute = ["/login", "/register"].includes(location.pathname);
  const isPublicRoute = ["/", "*"].includes(location.pathname) || location.pathname === "/not-found";

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} />
      {user && <NotificationToast />}

      <Routes>
        <Route path="/" element={<Home user={user} />} />
        
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />}
        />
        
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <Register onRegisterSuccess={handleLoginSuccess} />}
        />

        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/fraud-detection"
          element={user ? <FraudDetection /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/scam-analyzer"
          element={user ? <ScamAnalyzer /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;