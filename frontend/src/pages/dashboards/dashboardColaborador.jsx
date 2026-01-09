import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  AlertTriangle,
  Timer,
  UserRound,
  CalendarClock,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/dist/style.css";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import KpiCardsRow from "../../components/dashboard/KpiCardsRow";

import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

/* =====================================================
   HELPERS (FRONT)
===================================================== */
function fmtTime(t) {
  if (!t) return "-";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function chipClassByPresenca(status) {
  const s = String(status || "").toUpperCase();

  if (s === "PRESENTE")
    return "bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30";
  if (s === "ATRASO")
    return "bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30";

  // ausências (atestado, acidente, falta, etc)
  return "bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30";
}

function chipClassTempoEmpresa(label) {
  const v = String(label || "").toUpperCase();
  if (v.includes("< 30")) return "bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30";
  if (v.includes("30") && v.includes("89")) return "bg-[#FA4C00]/20 text-[#FA4C00] border border-[#FA4C00]/30";
  if (v.includes("≥") || v.includes(">= 90") || v.includes("90")) return "bg-[#34C759]/20 text-[#34C759] border border-[#34C759]/30";
  return "bg-[#2A2A2C] text-[#BFBFC3] border border-[#2A2A2C]";
}

/* =====================================================
   TABLE COMPONENT (LOCAL)
===================================================== */
function ColaboradoresTable({ data }) {
  return (
    <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-xl overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#161618] text-[#BFBFC3]">
          <tr>
            <th className="px-4 py-3 text-left">Colaborador</th>
            <th className="px-4 py-3 text-left">Líder</th>
            <th className="px-4 py-3 text-left">Setor</th>
            <th className="px-4 py-3 text-left">Turno</th>
            <th className="px-4 py-3 text-left">Escala</th>
            <th className="px-4 py-3 text-left">Tempo empresa</th>
            <th className="px-4 py-3 text-left">Entrada</th>
            <th className="px-4 py-3 text-left">Saída</th>
            <th className="px-4 py-3 text-left">Horas</th>
            <th className="px-4 py-3 text-left">Extra</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => {
            // compatibilidade com versões anteriores do backend:
            const nome = row.nomeCompleto || row.colaborador || "-";
            const lider = row.lider || "-";
            const empresa = row.empresa || "-";
            const setor = row.setor || "-";
            const turno = row.turno || "-";
            const escala = row.escala || "-";
            const tempoEmpresa = row.tempoEmpresa || "N/I";
            const entrada = row.entrada;
            const saida = row.saida;
            const horas = row.horasTrabalhadas ?? row.horas ?? 0;
            const extra = row.horasExtra ?? row.extra ?? 0;
            const status = row.statusPresenca || row.status || "-";

            return (
              <tr
                key={`${row.opsId || nome}-${row.turno}-${row.entrada || "no-entry"}`}
                className="border-t border-[#2A2A2C] hover:bg-[#222]"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{nome}</div>
                  <div className="text-xs text-[#BFBFC3]">{empresa}</div>
                </td>

                <td className="px-4 py-3">{lider}</td>
                <td className="px-4 py-3">{setor}</td>
                <td className="px-4 py-3">{turno}</td>
                <td className="px-4 py-3">{escala}</td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${chipClassTempoEmpresa(
                      tempoEmpresa
                    )}`}
                  >
                    {tempoEmpresa}
                  </span>
                </td>

                <td className="px-4 py-3">{fmtTime(entrada)}</td>
                <td className="px-4 py-3">{fmtTime(saida)}</td>

                <td className="px-4 py-3">{Number(horas || 0).toFixed(2)}h</td>

                <td
                  className={`px-4 py-3 ${
                    Number(extra || 0) > 0 ? "text-[#FA4C00]" : ""
                  }`}
                >
                  {Number(extra || 0).toFixed(2)}h
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${chipClassByPresenca(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}

          {!data.length && (
            <tr>
              <td
                colSpan={11}
                className="px-4 py-6 text-center text-[#BFBFC3]"
              >
                Nenhum colaborador encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   FILTER BAR (LOCAL)
===================================================== */
function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Todos",
  disabled = false,
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#BFBFC3]">{label}</span>
      <div className="relative">
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full appearance-none
            bg-[#1A1A1C] border border-[#2A2A2C]
            px-3 py-2 pr-9 rounded-lg text-sm
            text-white
            focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/30
            ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-[#222]"}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFBFC3]"
        />
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, onClear }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#BFBFC3]">Buscar</span>

      <div className="flex items-center gap-2 bg-[#1A1A1C] border border-[#2A2A2C] rounded-lg px-3 py-2">
        <Search size={16} className="text-[#BFBFC3]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nome / CPF / OpsId"
          className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#6F6F73]"
        />
        {value ? (
          <button
            onClick={onClear}
            className="text-[#BFBFC3] hover:text-white"
            title="Limpar"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* =====================================================
   PAGE
===================================================== */
export default function DashboardColaboradores() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // filtros
  const [turno, setTurno] = useState("");
  const [lider, setLider] = useState("");
  const [escala, setEscala] = useState("");
  const [search, setSearch] = useState("");

  /* 📅 DATE PICKER */
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftRange, setDraftRange] = useState({ from: null, to: null });
  const [appliedRange, setAppliedRange] = useState({ from: null, to: null });
  const calendarRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */
  async function loadDashboard({ range, turno, lider, escala, search } = {}) {
    try {
      setLoading(true);
      setErro(null);

      const params = {};

      if (range?.from) {
        params.dataInicio = range.from.toISOString().slice(0, 10);
        params.dataFim = (range.to || range.from).toISOString().slice(0, 10);
      }

      if (turno) params.turno = turno;
      if (lider) params.lider = lider;
      if (escala) params.escala = escala;
      if (search) params.search = search;

      const res = await api.get("/dashboard/colaboradores", { params });
      setDados(res.data.data);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        navigate("/login");
      } else {
        setErro("Erro ao carregar dashboard de colaboradores");
      }
    } finally {
      setLoading(false);
    }
  }


  // load inicial
  useEffect(() => {
    const today = new Date();
    setAppliedRange({ from: today, to: today });
  }, []);



  // fechar calendário ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  // debounce para busca
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
  loadDashboard({
    range: appliedRange,
    turno,
    lider,
    escala,
    search: debouncedSearch,
  });
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [appliedRange, turno, lider, escala, debouncedSearch]);



  /* =====================================================
     OPTIONS (do payload)
     - compatível com versões diferentes do backend
  ===================================================== */
  const liderOptions = useMemo(() => {
    const rows = dados?.colaboradores || [];
    const map = new Map();

    rows.forEach((c) => {
      if (c.lider && !map.has(c.lider)) {
        map.set(c.lider, {
          value: c.lider,
          label: c.lider,
        });
      }
    });

    return Array.from(map.values());
  }, [dados]);


  const escalaOptions = useMemo(() => {
    const dist = dados?.distribuicoes?.colaboradorPorEscala;
    if (!dist) return [];

    return Object.keys(dist).map((nome) => ({
      value: nome,      // ← envia o NOME da escala
      label: nome,
    }));
  }, [dados]);


  /* =====================================================
     KPIs (topo) — adaptado para seu novo backend
  ===================================================== */
  const kpis = useMemo(() => {
    const k = dados?.kpis || {};
    return [
      {
        icon: Users,
        label: "Colaboradores Ativos",
        value: k.ativos ?? 0,
      },
      {
        icon: Clock,
        label: "Presentes",
        value: k.presentes ?? 0,
      },
      {
        icon: AlertTriangle,
        label: "Atrasos",
        value: k.atrasos ?? 0,
        color: (k.atrasos ?? 0) > 0 ? "#FF9F0A" : "#34C759",
      },
      {
        icon: Timer,
        label: "Ausentes",
        value: k.ausentes ?? 0,
        color: (k.ausentes ?? 0) > 0 ? "#FF453A" : "#34C759",
      },
      {
        icon: UserRound,
        label: "Desligados",
        value: k.desligados ?? 0,
      },
      {
        icon: CalendarClock,
        label: "Média de Idade",
        value: k.mediaIdade ?? 0,
        suffix: " anos",
      },
    ];
  }, [dados]);

  /* =====================================================
     RENDER
  ===================================================== */
  if (loading && !dados) {
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 space-y-8">
          <DashboardHeader
            title="Dashboard de Colaboradores"
            subtitle="Presença, jornada e horas trabalhadas"
            date={dados?.dataOperacional}
            badges={[
              dados?.turnoAtual ? `Turno atual: ${dados.turnoAtual}` : "—",
              dados?.snapshotDate ? `Snapshot: ${dados.snapshotDate}` : null,
            ].filter(Boolean)}
          />

          {/* FILTER BAR */}
          <div className="bg-[#0D0D0D] border border-[#2A2A2C] rounded-xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              {/* DATE PICKER */}
              <div className="relative w-fit" ref={calendarRef}>
                <span className="text-xs text-[#BFBFC3] block mb-1">
                  Data
                </span>

                <button
                  onClick={() => setCalendarOpen((v) => !v)}
                  className="bg-[#1A1A1C] border border-[#2A2A2C] px-4 py-2 rounded-lg text-sm hover:bg-[#222]"
                >
                  📅{" "}
                  {appliedRange.from
                  ? appliedRange.to
                    ? `${appliedRange.from.toLocaleDateString("pt-BR")} - ${appliedRange.to.toLocaleDateString("pt-BR")}`
                    : appliedRange.from.toLocaleDateString("pt-BR")
                  : "Selecionar período"}
                </button>

                {calendarOpen && (
                  <div className="absolute z-50 mt-2 bg-[#0D0D0D] border border-[#2A2A2C] rounded-xl p-4 shadow-xl">
                    <DayPicker
                      mode="range"
                      selected={draftRange}
                      onSelect={setDraftRange}
                      locale={ptBR}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setDraftRange({ from: null, to: null });
                          setCalendarOpen(false);
                        }}
                        className="text-xs text-[#BFBFC3]"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={() => {
                          if (!draftRange?.from) return;
                          setAppliedRange({
                            from: draftRange.from,
                            to: draftRange.to || draftRange.from,
                          });

                          setCalendarOpen(false);
                        }}
                        className="bg-[#FA4C00] px-4 py-1.5 rounded-md text-sm font-medium"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Select
                label="Turno"
                value={turno}
                onChange={setTurno}
                options={[
                  { value: "T1", label: "T1" },
                  { value: "T2", label: "T2" },
                  { value: "T3", label: "T3" },
                ]}
                placeholder="Todos"
              />

              <Select
                label="Líder"
                value={lider}
                onChange={setLider}
                options={liderOptions}
                placeholder={
                  liderOptions.length ? "Todos" : "Sem lista"
                }
                disabled={!liderOptions.length}
              />

              <Select
                label="Escala"
                value={escala}
                onChange={setEscala}
                options={escalaOptions}
                placeholder={
                  escalaOptions.length ? "Todas" : "Sem lista"
                }
                disabled={!escalaOptions.length}
              />

              <div className="flex-1">
                <SearchBox
                  value={search}
                  onChange={setSearch}
                  onClear={() => setSearch("")}
                />
              </div>
            </div>

            {/* RESET */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setTurno("");
                  setLider("");
                  setEscala("");
                  setSearch("");
                  setAppliedRange({ from: null, to: null });
                  setDraftRange({ from: null, to: null });
                }}
                className="text-xs text-[#BFBFC3] hover:text-white"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <KpiCardsRow items={kpis} />

          {/* KPI extra linha 2 (se existir no payload) */}
          {dados?.kpis?.tempoMedioEmpresa != null && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-xl p-4">
                <div className="text-xs text-[#BFBFC3]">Tempo médio de empresa</div>
                <div className="text-2xl font-semibold mt-1">
                  {Number(dados.kpis.tempoMedioEmpresa).toFixed(1)} anos
                </div>
                <div className="text-xs text-[#6F6F73] mt-1">
                  calculado pela data de admissão
                </div>
              </div>

              <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-xl p-4">
                <div className="text-xs text-[#BFBFC3]">Total na tabela</div>
                <div className="text-2xl font-semibold mt-1">
                  {dados?.pagination?.total ?? (dados?.colaboradores?.length || 0)}
                </div>
                <div className="text-xs text-[#6F6F73] mt-1">
                  após filtros aplicados
                </div>
              </div>

              <div className="bg-[#1A1A1C] border border-[#2A2A2C] rounded-xl p-4">
                <div className="text-xs text-[#BFBFC3]">Data do dashboard</div>
                <div className="text-2xl font-semibold mt-1">
                  {dados?.dataOperacional || "-"}
                </div>
                <div className="text-xs text-[#6F6F73] mt-1">
                  dia operacional
                </div>
              </div>
            </div>
          )}

          <ColaboradoresTable data={dados?.colaboradores || []} />

          {/* PAGINAÇÃO (se vier do backend) */}
          {dados?.pagination && (
            <div className="flex items-center justify-between text-sm text-[#BFBFC3]">
              <div>
                Página {dados.pagination.page} • {dados.pagination.total} registros
              </div>
              <div className="text-xs text-[#6F6F73]">
                pageSize: {dados.pagination.pageSize}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
