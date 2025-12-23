import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Register from "./pages/register";
import Colaboradores from "./pages/colaboradores";
import EmpresasPage from "./pages/empresas";
import CargosPage from "./pages/cargos";
import SetoresPage from "./pages/Setores";
import PontoPage from "./pages/Ponto";

import { AuthContext } from "./context/AuthContext";

/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const hasToken = !!localStorage.getItem("token");

  if (isAuthenticated || hasToken) {
    return children;
  }

  return <Navigate to="/login" replace />;
}

/* ================= APP ================= */
export default function App() {
  return (
    <Routes>

      {/* ===== ROTAS PÚBLICAS ===== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ===== ROTAS PROTEGIDAS ===== */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/colaboradores"
        element={
          <ProtectedRoute>
            <Colaboradores />
          </ProtectedRoute>
        }
      />

      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <EmpresasPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cargos"
        element={
          <ProtectedRoute>
            <CargosPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/setores"
        element={
          <ProtectedRoute>
            <SetoresPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ponto"
        element={
          <ProtectedRoute>
            <PontoPage />
          </ProtectedRoute>
        }
      />

      {/* ===== FALLBACK ===== */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}
