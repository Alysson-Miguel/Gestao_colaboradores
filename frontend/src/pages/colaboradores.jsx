import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
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
    } catch (err) {
      console.error("Erro ao listar colaboradores:", err);
      alert("Erro ao carregar colaboradores.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNew = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (emp) => {
    setSelected(emp);
    setModalOpen(true);
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Excluir o colaborador "${emp.nomeCompleto}"?`)) return;
    try {
      await ColaboradoresAPI.excluir(emp.opsId);
      load();
    } catch (err) {
      console.error("Erro ao excluir colaborador:", err);
      alert("Erro ao excluir colaborador.");
    }
  };

  // -------------------------
  // FILTROS
  // -------------------------
  const filtered = employees.filter((e) => {
    // FILTRO DE BUSCA
    if (query) {
      const q = query.toLowerCase();
      const matchBusca =
        e.nomeCompleto?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.cpf?.toLowerCase().includes(q) ||
        String(e.opsId)?.includes(q);

      if (!matchBusca) return false;
    }

    // FILTRO DE TURNO
    if (turnoSelecionado !== "TODOS") {
      const turnoEmpregado =
        e?.turno?.nomeTurno || e?.turno || "Sem Turno";

      if (turnoEmpregado !== turnoSelecionado) return false;
    }

    return true;
  });

  const turnos = ["TODOS", "T1", "T2", "T3"];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Colaboradores
            </h1>

            {/* BARRA DE AÇÕES */}
            <div className="flex items-center gap-3">

              {/* CAMPO DE BUSCA */}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nome, e-mail, CPF ou OPS ID..."
                className="px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white"
              />

              {/* SELETOR DE TURNO */}
              <select
                value={turnoSelecionado}
                onChange={(e) => setTurnoSelecionado(e.target.value)}
                className="px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:text-white"
              >
                {turnos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* BOTÃO ADICIONAR */}
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow"
              >
                <Plus className="w-4 h-4" />
                Adicionar Colaborador
              </button>
            </div>
          </div>

          {/* LISTA */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            {loading ? (
              <p className="p-6 text-gray-500">Carregando colaboradores...</p>
            ) : (
              <EmployeeTable
                employees={filtered}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
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
            try {
              if (selected) {
                await ColaboradoresAPI.atualizar(selected.opsId, data);
              } else {
                await ColaboradoresAPI.criar(data);
              }
              setModalOpen(false);
              setSelected(null);
              load();
            } catch (err) {
              console.error("Erro ao salvar colaborador:", err);
              alert("Erro ao salvar colaborador.");
            }
          }}
        />
      )}
    </div>
  );
}
