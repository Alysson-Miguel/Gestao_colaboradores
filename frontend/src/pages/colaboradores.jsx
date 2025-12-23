import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import EmployeeModal from "../components/EmployeeModal";
import EmployeeTable from "../components/EmployeeTable";
import { ColaboradoresAPI } from "../services/colaboradores";

export default function ColaboradoresPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [turnoSelecionado, setTurnoSelecionado] = useState("TODOS");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ColaboradoresAPI.listar({
        limit: 1000,
        search: query || undefined,
      });
      setEmployees(list);
    } catch {
      alert("Erro ao carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = employees.filter((e) => {
    if (query) {
      const q = query.toLowerCase();
      const match =
        e.nomeCompleto?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.cpf?.toLowerCase().includes(q) ||
        String(e.opsId)?.includes(q);
      if (!match) return false;
    }

    if (turnoSelecionado !== "TODOS") {
      const turno = e?.turno?.nomeTurno || e?.turno || "Sem Turno";
      if (turno !== turnoSelecionado) return false;
    }

    return true;
  });

  const turnos = ["TODOS", "T1", "T2", "T3"];

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 space-y-6">

          {/* TÍTULO */}
          <div>
            <h1 className="text-2xl font-semibold">Colaboradores</h1>
            <p className="text-sm text-[#BFBFC3]">
              Gestão e controle de colaboradores ativos
            </p>
          </div>

          {/* BARRA DE FILTROS */}
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* FILTROS */}
            <div className="flex items-center gap-3 flex-wrap">

              {/* BUSCA */}
              <div className="flex items-center gap-2 bg-[#1A1A1C] px-4 py-2 rounded-xl">
                <Search size={16} className="text-[#BFBFC3]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar colaborador..."
                  className="bg-transparent outline-none text-sm text-white placeholder-[#BFBFC3]"
                />
              </div>

              {/* TURNO */}
              <select
                value={turnoSelecionado}
                onChange={(e) => setTurnoSelecionado(e.target.value)}
                className="
                  bg-[#1A1A1C]
                  text-sm
                  px-4 py-2
                  rounded-xl
                  text-[#BFBFC3]
                  outline-none
                  hover:bg-[#2A2A2C]
                "
              >
                {turnos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                setSelected(null);
                setModalOpen(true);
              }}
              className="
                inline-flex items-center gap-2
                px-5 py-2.5
                bg-[#FA4C00]
                hover:bg-[#ff5a1a]
                text-sm font-medium
                rounded-xl
                transition
              "
            >
              <Plus size={16} />
              Novo Colaborador
            </button>
          </div>

          {/* LISTAGEM */}
          <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-[#BFBFC3]">Carregando colaboradores…</div>
            ) : (
              <EmployeeTable
                employees={filtered}
                onEdit={(emp) => {
                  setSelected(emp);
                  setModalOpen(true);
                }}
                onDelete={async (emp) => {
                  if (!window.confirm(`Excluir ${emp.nomeCompleto}?`)) return;
                  await ColaboradoresAPI.excluir(emp.opsId);
                  load();
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <EmployeeModal
          key={selected?.opsId || "new"}
          employee={selected}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
          onSave={async (data) => {
            if (selected) {
              await ColaboradoresAPI.atualizar(selected.opsId, data);
            } else {
              await ColaboradoresAPI.criar(data);
            }
            setModalOpen(false);
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
