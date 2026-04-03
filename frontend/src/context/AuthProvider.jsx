import { useState, useEffect, useMemo } from "react";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // 🔥 NOVO

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (
        token &&
        token !== "undefined" &&
        storedUser &&
        storedUser !== "undefined"
      ) {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);
        setIsAuthenticated(true);

        console.log("✅ Sessão restaurada:", parsedUser?.name);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("❌ Erro ao restaurar sessão:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false); // 🔥 ESSENCIAL
    }
  }, []);

  const login = (userData, token) => {
    if (!userData || !token) {
      console.error("❌ Dados de login inválidos!");
      return;
    }

    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const permissions = useMemo(() => {
    return {
      isAdmin: user?.role === "ADMIN",
      isAltaGestao: user?.role === "ALTA_GESTAO",
      isLideranca: user?.role === "LIDERANCA",
      isOperacao: user?.role === "OPERACAO",
    };
  }, [user]);

  const hasRole = (...roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  // 🔄 Enquanto carrega sessão, não renderiza app
  if (isLoadingAuth) {
    return null; // ou <LoadingScreen />
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth, // 🔥 IMPORTANTE
        permissions,
        hasRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}