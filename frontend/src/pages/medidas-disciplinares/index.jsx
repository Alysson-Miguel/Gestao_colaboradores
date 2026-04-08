import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MedidaDisciplinarCard from "../../components/MedidaDisciplinarCard";
import { MedidasDisciplinaresAPI } from "../../services/medidasDisciplinares";
import api from "../../services/api";

const selectClass = "bg-surface border border-default rounded-xl px-3 py-2 text-sm text-page outline-none cursor-pointer";

export default function MedidasDisciplinaresPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [medidas, setMedidas] = useState([]);
  const [loading, setLoading] = useState(true);

  /* opções dos selects */
  const [turnos, setTurnos] = useState([]);
  const [lideres, setLideres] = useState([]);

  /* filtros */
  const [filtroData, setFiltroData] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroLider, setFiltroLider] = useState("");

  /* carrega opções dos selects uma vez */
  useEffect(() => {
    api.get("/turnos").then((r) => setTurnos(r.data.data || [])).catch(() => {});
    api.get("/colaboradores/lideres").then((r) => setLideres(r.data.data || [])).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await MedidasDisciplinaresAPI.listar({
        data: filtroData || undefined,
        nome: filtroNome || undefined,
        turno: filtroTurno || undefined,
        lider: filtroLider || undefined,
      });
      setMedidas(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar medidas disciplinares");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 max-w-5xl mx-auto space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Medidas Disciplinares</h1>
              <p className="text-sm text-muted">Histórico disciplinar dos colaboradores</p>
            </div>
            <button
              onClick={() => navigate("/medidas-disciplinares/novo")}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FA4C00] hover:bg-[#ff5a1a] rounded-xl text-sm font-medium text-white"
            >
              <Plus size={16} />
              Nova Medida
            </button>
          </div>

          {/* FILTROS */}
          <div className="flex flex-wrap items-center gap-3">
            {/* DATA */}
            <div className="bg-surface border border-default rounded-xl px-3 py-2">
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="bg-transparent outline-none text-sm text-page"
              />
            </div>

            {/* COLABORADOR */}
            <div className="bg-surface border border-default rounded-xl px-3 py-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar colaborador"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="bg-transparent outline-none text-sm text-page placeholder-muted w-44"
              />
            </div>

            {/* TURNO */}
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className={selectClass}
            >
              <option value="">Todos os turnos</option>
              {turnos.map((t) => (
                <option key={t.idTurno} value={t.nomeTurno}>{t.nomeTurno}</option>
              ))}
            </select>

            {/* LÍDER */}
            <select
              value={filtroLider}
              onChange={(e) => setFiltroLider(e.target.value)}
              className={selectClass}
            >
              <option value="">Todos os líderes</option>
              {lideres.map((l) => (
                <option key={l.opsId} value={l.nomeCompleto}>{l.nomeCompleto}</option>
              ))}
            </select>

            <button
              onClick={load}
              className="px-4 py-2 rounded-xl bg-[#FA4C00] hover:bg-[#ff5a1a] text-white text-sm font-medium"
            >
              Filtrar
            </button>
          </div>

          {/* LISTA */}
          {loading ? (
            <div className="text-muted">Carregando medidas disciplinares…</div>
          ) : medidas.length === 0 ? (
            <div className="text-muted">Nenhuma medida disciplinar encontrada</div>
          ) : (
            <div className="space-y-4">
              {medidas.map((m) => (
                <MedidaDisciplinarCard key={m.idMedida} medida={m} onAtualizado={load} />
              ))}
            </div>
          )}
        </main>
      </MainLayout>
    </div>
  );
}
