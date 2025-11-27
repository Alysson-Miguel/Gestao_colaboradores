import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, LayoutDashboard, Clock, CalendarOff, Building2, Briefcase, Layers,
  FileText, Settings, Menu, X, Bell, User, LogOut, Sun, Moon, Plus,
  Search, Filter, TrendingUp, Download
} from "lucide-react";

import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";

// ============= SIDEBAR =============
function Sidebar({ isOpen, onClose, navigate }) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', active: true },
    { icon: Users, label: 'Colaboradores', path: '/colaboradores' },
    { icon: Clock, label: 'Ponto', path: '/ponto' },
    { icon: CalendarOff, label: 'Ausências', path: '/ausencias' },
    { icon: Building2, label: 'Empresas', path: '/empresas' },
    { icon: Layers, label: 'Departamentos', path: '/departamentos' },
    { icon: Briefcase, label: 'Cargos', path: '/cargos' },
    { icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    { icon: Users, label: 'UI Components', path: '/ui-components' }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        w-64
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">GestãoRH</span>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${item.active
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

// ============= HEADER =============
function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { isDark, setIsDark } = useContext(ThemeContext);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bem-vindo de volta!</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun /> : <Moon />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nome}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.papel}</p>
            </div>
          </button>

          {/* User dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-2 z-50">
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============= STAT CARD =============
function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
      <div className="p-3 bg-blue-600 rounded-xl inline-block mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </div>
  );
}

// ============= DASHBOARD PAGE =============
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const stats = [
    { title: "Total de Colaboradores", value: "142", icon: Users },
    { title: "Colaboradores Ativos", value: "138", icon: Users },
    { title: "Ausências Hoje", value: "3", icon: CalendarOff },
    { title: "Pontos Registrados", value: "125", icon: Clock }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Botão de acesso rápido aos UI Components */}
          <button
            onClick={() => navigate("/ui-components")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium"
          >
            Ver UI Components
          </button>
        </main>
      </div>
    </div>
  );
}
