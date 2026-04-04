import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export const EstacaoContext = createContext(null);

const GLOBAL_ROLES = ["ADMIN", "ALTA_GESTAO"];
const STORAGE_KEY = "estacao_selecionada";

export function EstacaoProvider({ children }) {
  const { user } = useContext(AuthContext);
  const isGlobal = GLOBAL_ROLES.includes(user?.role);

  // null = todas as estações, número = estação específica
  const [estacaoId, setEstacaoId] = useState(() => {
    if (!isGlobal) return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });

  // Quando muda o usuário, reseta
  useEffect(() => {
    if (!isGlobal) {
      setEstacaoId(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user?.id, isGlobal]);

  const selecionarEstacao = (id) => {
    const valor = id ? Number(id) : null;
    setEstacaoId(valor);
    if (valor) {
      localStorage.setItem(STORAGE_KEY, String(valor));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <EstacaoContext.Provider value={{ estacaoId, isGlobal, selecionarEstacao }}>
      {children}
    </EstacaoContext.Provider>
  );
}

export function useEstacao() {
  return useContext(EstacaoContext);
}
