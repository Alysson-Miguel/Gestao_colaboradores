import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Recupera usuário e token do localStorage ao iniciar
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      // 🔥 CORREÇÃO: Verifica se realmente existe E não é "undefined" (string)
      if (token && token !== "undefined" && storedUser && storedUser !== "undefined") {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("✅ Sessão restaurada:", parsedUser.name);
      } else {
        // Limpa localStorage se houver dados inválidos
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        console.log("⚠️ Nenhuma sessão válida encontrada");
      }
    } catch (error) {
      console.error("❌ Erro ao restaurar sessão:", error);
      // Limpa localStorage em caso de erro
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);

  const login = (userData, token) => {
    console.log("🔐 Login chamado com:", { userData, token: token?.substring(0, 20) + "..." });
    
    if (!userData || !token) {
      console.error("❌ Dados de login inválidos!");
      return;
    }

    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    console.log("✅ Login salvo no localStorage");
  };

  const logout = () => {
    console.log("🚪 Logout realizado");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}