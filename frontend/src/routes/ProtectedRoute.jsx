import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, isLoadingAuth } = useContext(AuthContext);

  // 🔄 Aguarda restaurar sessão
  if (isLoadingAuth) {
    return null; // ou spinner
  }

  // ❌ Não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔐 Controle de role
  if (roles && roles.length > 0) {
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/dashboard/operacional" replace />;
    }
  }

  // ✅ Autorizado
  return children;
}