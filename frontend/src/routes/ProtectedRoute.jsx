import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";

import ColaboradoresPage from "./pages/colaboradores";
import EmpresasPage from "./pages/empresas";
import SetoresPage from "./pages/setores";
import CargosPage from "./pages/cargos";
import PontoPage from "./pages/ponto";

import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>

      {/* ================= ROTAS PÚBLICAS ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= ROTAS PROTEGIDAS ================= */}
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
            <ColaboradoresPage />
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
        path="/setores"
        element={
          <ProtectedRoute>
            <SetoresPage />
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
        path="/ponto"
        element={
          <ProtectedRoute>
            <PontoPage />
          </ProtectedRoute>
        }
      />

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}
