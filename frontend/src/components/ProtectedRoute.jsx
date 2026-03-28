import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/apiService";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth();
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Verify token is still valid by making an API request
      const verifyToken = async () => {
        try {
          const accessToken = localStorage.getItem("accessToken");

          if (!accessToken) {
            setTokenValid(false);
            return;
          }

          // Make a simple API call to verify token
          await api.get("/subjects/");
          setTokenValid(true);
        } catch (error) {
          // Token is invalid or expired
          console.error("Token validation failed:", error.response?.status);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          await logout();
          setTokenValid(false);
        }
      };

      verifyToken();
    }
  }, [isAuthenticated, loading, logout]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <p>Authenticating...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If token validation is in progress, show loading
  if (tokenValid === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <p>Verifying token...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If token is invalid, redirect to login
  if (!tokenValid) {
    return <Navigate to="/login" replace />;
  }

  // Token is valid, show the protected content
  return children;
};

export default ProtectedRoute;
