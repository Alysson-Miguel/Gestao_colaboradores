import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useEstacao } from "../context/EstacaoContext";
import ModuloIndisponivel from "../components/mapaOperacional/ModuloIndisponivel";

// A Label só existe na estação 1 (Jaboatão) por enquanto.
const ESTACAO_DA_LABEL = 1;

/**
 * Rota das telas da Label. Igual ao ProtectedRoute (login e perfil), mas em outra estação mostra o aviso
 * "módulo não disponível ainda" no lugar de redirecionar ou de carregar telas que só dariam erro de API.
 */
export default function LabelRoute({ children, roles }) {
  const { isAuthenticated, user, isLoadingAuth } = useContext(AuthContext);
  const { getEstacaoEfetiva } = useEstacao();

  if (isLoadingAuth) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles?.length && (!user || !roles.includes(user.role))) {
    return <Navigate to={user?.role === "OPERACAO" ? "/ponto" : "/dashboard/operacional"} replace />;
  }

  // Admin vendo "todas as estações" (sem seleção) cai na estação 1, como o backend faz
  const estacao = getEstacaoEfetiva();
  if (estacao && estacao !== ESTACAO_DA_LABEL) return <ModuloIndisponivel />;

  return children;
}
