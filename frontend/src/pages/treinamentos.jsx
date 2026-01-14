import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import { TreinamentosAPI } from "../services/treinamentos";
import { AuthContext } from "../context/AuthContext";

/* =====================================================
   PAGE — TREINAMENTOS
===================================================== */
export default function TreinamentosPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [treinamentos, setTreinamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await TreinamentosAPI.listar();
        setTreinamentos(data || []);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          navigate("/login");
        } else {
          setErro("Erro ao carregar treinamentos");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [logout, navigate]);

  /* ================= HELPERS ================= */
  const badgeStatus = (status) => {
    if (status === "FINALIZADO") {
      return (
        <span className="flex items-center gap-1 text-xs text-[#34C759]">
          <CheckCircle size={14} /> Finalizado
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-[#FF9F0A]">
        <Clock size={14} /> Em aberto
      </span>
    );
  };

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#BFBFC3]">
        Carregando…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center text-[#FF453A]">
        {erro}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 space-y-8">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Treinamentos
              </h1>
              <p className="text-sm text-[#BFBFC3]">
                Gestão e controle de treinamentos
              </p>
            </div>

            <button
              onClick={() => navigate("/treinamentos/novo")}
              className="flex items-center gap-2 bg-[#FA4C00] hover:bg-[#D84300] text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Plus size={16} />
              Novo Treinamento
            </button>
          </div>

          {/* LISTAGEM */}
          <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#262628] text-[#BFBFC3]">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Tema</th>
                  <th className="px-4 py-3 text-left">Processo</th>
                  <th className="px-4 py-3 text-left">SOC</th>
                  <th className="px-4 py-3 text-left">Líder</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {treinamentos.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-[#BFBFC3]"
                    >
                      Nenhum treinamento cadastrado
                    </td>
                  </tr>
                )}

                {treinamentos.map((t) => (
                  <tr
                    key={t.idTreinamento}
                    className="border-t border-[#2A2A2C] hover:bg-[#1F1F22]"
                  >
                    <td className="px-4 py-3">
                      {new Date(t.dataTreinamento).toLocaleDateString("pt-BR")}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {t.tema}
                    </td>

                    <td className="px-4 py-3">
                      {t.processo}
                    </td>

                    <td className="px-4 py-3">
                      {t.soc}
                    </td>

                    <td className="px-4 py-3">
                      {t.liderResponsavel?.nomeCompleto || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {badgeStatus(t.status)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          navigate(`/treinamentos/${t.idTreinamento}`)
                        }
                        className="inline-flex items-center gap-1 text-[#0A84FF] hover:underline"
                      >
                        <FileText size={14} />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
