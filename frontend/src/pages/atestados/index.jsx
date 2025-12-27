import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AtestadoCard from "../../components/AtestadoCard";
import { AtestadosAPI } from "../../services/atestados";

export default function AtestadosPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [atestados, setAtestados] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    let isMounted = true;

    async function fetchAtestados() {
      try {
        const data = await AtestadosAPI.listar();
        if (isMounted) {
          setAtestados(data);
        }
      } catch {
        alert("Erro ao carregar atestados médicos");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAtestados();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================= ACTIONS ================= */
  async function refresh() {
    const data = await AtestadosAPI.listar();
    setAtestados(data);
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

        <main className="p-8 max-w-5xl mx-auto space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Atestados Médicos</h1>
              <p className="text-sm text-[#BFBFC3]">
                Gestão de afastamentos médicos
              </p>
            </div>

            <button
              onClick={() => navigate("/atestados/novo")}
              className="
                flex items-center gap-2
                px-5 py-2.5
                bg-[#FA4C00]
                hover:bg-[#ff5a1a]
                rounded-xl
                text-sm font-medium
              "
            >
              <Plus size={16} />
              Novo Atestado
            </button>
          </div>

          {/* LISTA */}
          {loading ? (
            <div className="text-[#BFBFC3]">Carregando atestados…</div>
          ) : atestados.length === 0 ? (
            <div className="text-[#BFBFC3]">
              Nenhum atestado médico registrado
            </div>
          ) : (
            <div className="space-y-4">
              {atestados.map((a) => (
                <AtestadoCard
                  key={a.idAtestado}
                  atestado={a}
                  onEdit={() =>
                    navigate(`/atestados/${a.idAtestado}/editar`)
                  }
                  onFinalizar={async () => {
                    await AtestadosAPI.finalizar(a.idAtestado);
                    refresh();
                  }}
                  onCancelar={async () => {
                    await AtestadosAPI.cancelar(a.idAtestado);
                    refresh();
                  }}
                />
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
