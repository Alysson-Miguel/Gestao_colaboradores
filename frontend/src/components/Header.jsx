import { Menu, Sun, Moon, User, LogOut } from "lucide-react";
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function Header({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);
  const { isDark, setIsDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="
        h-16
        px-6
        flex items-center justify-between
        bg-[#0D0D0D]/80
        backdrop-blur
        sticky top-0 z-30
      "
    >
      {/* ESQUERDA */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[#1A1A1C] transition"
        >
          <Menu size={20} className="text-[#BFBFC3]" />
        </button>

        <span className="hidden sm:block text-sm text-[#BFBFC3]">
          Dashboard
        </span>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-3">
        {/* Toggle tema */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-[#1A1A1C] transition"
          title="Alternar tema"
        >
          {isDark ? (
            <Sun size={18} className="text-[#FFD60A]" />
          ) : (
            <Moon size={18} className="text-[#BFBFC3]" />
          )}
        </button>

        {/* Usuário */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1A1C] transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#FA4C00] flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>

            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm text-white font-medium">
                {user?.nome}
              </span>
              <span className="text-xs text-[#BFBFC3]">
                {user?.papel || "Usuário"}
              </span>
            </div>
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className="
                absolute right-0 mt-3 w-48
                bg-[#1A1A1C]
                rounded-xl
                shadow-xl
                py-2
                z-50
              "
            >
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="
                  w-full px-4 py-2
                  flex items-center gap-3
                  text-sm text-[#FF453A]
                  hover:bg-[#2A2A2C]
                  transition
                "
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
