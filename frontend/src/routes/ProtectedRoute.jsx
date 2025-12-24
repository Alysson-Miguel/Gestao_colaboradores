import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const hasToken = !!localStorage.getItem("token");

  if (isAuthenticated || hasToken) {
    return children;
  }

  return <Navigate to="/login" replace />;
}
