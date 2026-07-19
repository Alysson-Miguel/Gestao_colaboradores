import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../../components/MainLayout";
import {
  Plus, FileText, CheckCircle, Clock, XCircle, CalendarClock,
  Search, ChevronLeft, ChevronRight, Filter,
} from "lucide-react";

import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

import { SolicitacoesTreinamentoAPI } from "../../../services/solicitacoesTreinamento";
import api from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";

const LIMIT = 20;

/* ─── STATUS BADGE ─────────────────────────────────── */
export function StatusSolicitacaoBadge({ status }) {
  if (status === "APROVADA")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
        <CheckCircle size={11} /> Aprovada
      </span>
    );
  if (status === "NEGADA")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20">
        <XCircle size={11} /> Negada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
      <Clock size={11} /> Pendente
    </span>
  );
}

/* ─── PAGINATION ───────────────────────────────────── */
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-default">
      <span className="text-xs text-muted">Página {page} de {totalPages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg text-muted hover:text-page hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page hover:bg-surface-2"}`}
          >
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg text-muted hover:text-page hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   PAGE — SOLICITAÇÕES DE TREINAMENTO
===================================================== */
export default function SolicitacoesTreinamentoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState({ pendentes: 0, aprovadas: 0, negadas: 0, agendadosSemana: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [erro, setErro] = useState(null);
  const [page, setPage] = useState(1);

  const [setores, setSetores] = useState([]);
  const [turnos, setTurnos] = useState([]);

  /* filtros */
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroSetor, setFiltroSetor] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroTema, setFiltroTema] = useState("");
  const [filtroProcesso, setFiltroProcesso] = useState("");
  const [filtroSolicitante, setFiltroSolicitante] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const [temaDebounced, setTemaDebounced] = useState("");
  const [processoDebounced, setProcessoDebounced] = useState("");
  const [solicitanteDebounced, setSolicitanteDebounced] = useState("");
  const temaTimer = useRef(null);
  const processoTimer = useRef(null);
  const solicitanteTimer = useRef(null);

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleTema = (v) => {
    setFiltroTema(v);
    clearTimeout(temaTimer.current);
    temaTimer.current = setTimeout(() => { setTemaDebounced(v); setPage(1); }, 400);
  };
  const handleProcesso = (v) => {
    setFiltroProcesso(v);
    clearTimeout(processoTimer.current);
    processoTimer.current = setTimeout(() => { setProcessoDebounced(v); setPage(1); }, 400);
  };
  const handleSolicitante = (v) => {
    setFiltroSolicitante(v);
    clearTimeout(solicitanteTimer.current);
    solicitanteTimer.current = setTimeout(() => { setSolicitanteDebounced(v); setPage(1); }, 400);
  };

  const hasFilters = filtroStatus || filtroSetor || filtroTurno || filtroTema || filtroProcesso || filtroSolicitante || filtroDataInicio || filtroDataFim;

  const clearFilters = () => {
    setFiltroStatus(""); setFiltroSetor(""); setFiltroTurno("");
    setFiltroTema(""); setTemaDebounced("");
    setFiltroProcesso(""); setProcessoDebounced("");
    setFiltroSolicitante(""); setSolicitanteDebounced("");
    setFiltroDataInicio(""); setFiltroDataFim("");
    setPage(1);
  };

  useEffect(() => {
    Promise.all([api.get("/setores"), api.get("/turnos")])
      .then(([setoresRes, turnosRes]) => {
        setSetores(setoresRes.data.data || setoresRes.data || []);
        setTurnos(turnosRes.data.data || turnosRes.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    SolicitacoesTreinamentoAPI.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await SolicitacoesTreinamentoAPI.listar({
          page,
          limit: LIMIT,
          status: filtroStatus || undefined,
          idSetor: filtroSetor || undefined,
          idTurno: filtroTurno || undefined,
          tema: temaDebounced || undefined,
          processo: processoDebounced || undefined,
          solicitante: solicitanteDebounced || undefined,
          dataInicio: filtroDataInicio || undefined,
          dataFim: filtroDataFim || undefined,
        });
        if (cancelled) return;
        setSolicitacoes(res.data || []);
        setPagination({
          page: res.pagination?.page ?? 1,
          totalPages: res.pagination?.totalPages ?? 1,
          total: res.pagination?.total ?? 0,
        });
      } catch (e) {
        if (cancelled) return;
        if (e.response?.status === 401) { logout(); navigate("/login"); }
        else setErro("Erro ao carregar solicitações");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, filtroStatus, filtroSetor, filtroTurno, temaDebounced, processoDebounced, solicitanteDebounced, filtroDataInicio, filtroDataFim, logout, navigate]);

  if (erro) {
    return <div className="h-screen flex items-center justify-center text-[#FF453A]">{erro}</div>;
  }

  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6 md:p-8 space-y-6">
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Solicitações de Treinamento</h1>
              <p className="text-sm text-muted mt-0.5">Planejamento e aprovação de treinamentos futuros</p>
            </div>
            <button
              onClick={() => navigate("/treinamentos/solicitacoes/nova")}
              className="flex items-center gap-2 bg-[#FA4C00] hover:bg-[#D84300] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Nova Solicitação
            </button>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface rounded-2xl p-5 border border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Pendentes</p>
                  <p className="text-2xl font-bold text-[#FF9F0A]">{loadingStats ? "—" : stats.pendentes}</p>
                </div>
                <div className="p-2.5 bg-[#FF9F0A]/10 rounded-xl"><Clock size={22} className="text-[#FF9F0A]" /></div>
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-5 border border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Aprovadas</p>
                  <p className="text-2xl font-bold text-[#34C759]">{loadingStats ? "—" : stats.aprovadas}</p>
                </div>
                <div className="p-2.5 bg-[#34C759]/10 rounded-xl"><CheckCircle size={22} className="text-[#34C759]" /></div>
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-5 border border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Negadas</p>
                  <p className="text-2xl font-bold text-[#FF453A]">{loadingStats ? "—" : stats.negadas}</p>
                </div>
                <div className="p-2.5 bg-[#FF453A]/10 rounded-xl"><XCircle size={22} className="text-[#FF453A]" /></div>
              </div>
            </div>
            <div className="bg-surface rounded-2xl p-5 border border-default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted mb-1">Agendados na Semana</p>
                  <p className="text-2xl font-bold text-[#0A84FF]">{loadingStats ? "—" : stats.agendadosSemana}</p>
                </div>
                <div className="p-2.5 bg-[#0A84FF]/10 rounded-xl"><CalendarClock size={22} className="text-[#0A84FF]" /></div>
              </div>
            </div>
          </div>

          {/* ── FILTROS ── */}
          <div className="bg-surface rounded-2xl border border-default p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-muted" />
              <span className="text-xs font-medium text-muted uppercase tracking-wide">Filtros</span>
              {hasFilters && (
                <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-[#FF453A] transition-colors">
                  <XCircle size={13} /> Limpar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Data início</label>
                <input type="date" value={filtroDataInicio} onChange={(e) => { setFiltroDataInicio(e.target.value); setPage(1); }} className="px-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Data fim</label>
                <input type="date" value={filtroDataFim} onChange={(e) => { setFiltroDataFim(e.target.value); setPage(1); }} className="px-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Status</label>
                <select value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value); setPage(1); }} className="px-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all appearance-none">
                  <option value="">Todos</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="APROVADA">Aprovada</option>
                  <option value="NEGADA">Negada</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Setor</label>
                <select value={filtroSetor} onChange={(e) => { setFiltroSetor(e.target.value); setPage(1); }} className="px-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all appearance-none">
                  <option value="">Todos</option>
                  {setores.map((s) => <option key={s.idSetor} value={s.idSetor}>{s.nomeSetor}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Turno</label>
                <select value={filtroTurno} onChange={(e) => { setFiltroTurno(e.target.value); setPage(1); }} className="px-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all appearance-none">
                  <option value="">Todos</option>
                  {turnos.map((t) => <option key={t.idTurno} value={t.idTurno}>{t.nomeTurno}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Tema</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input type="text" placeholder="Buscar tema..." value={filtroTema} onChange={(e) => handleTema(e.target.value)} className="w-full pl-7 pr-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Processo</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input type="text" placeholder="Buscar processo..." value={filtroProcesso} onChange={(e) => handleProcesso(e.target.value)} className="w-full pl-7 pr-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted">Solicitante</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input type="text" placeholder="Buscar solicitante..." value={filtroSolicitante} onChange={(e) => handleSolicitante(e.target.value)} className="w-full pl-7 pr-3 py-2 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* ── TABELA ── */}
          <div className="bg-surface rounded-2xl border border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-default">
              <span className="text-xs text-muted">
                {loading ? "Carregando…" : `${pagination.total} solicitaç${pagination.total !== 1 ? "ões" : "ão"}`}
              </span>
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <div className="w-3 h-3 rounded-full border-2 border-[#FA4C00] border-t-transparent animate-spin" />
                  Atualizando
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-2 border-b border-default">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide whitespace-nowrap">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide whitespace-nowrap">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Tema</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Processo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Solicitante</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Setor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Turno</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Participantes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Aprovador</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>

                <tbody className={loading ? "opacity-50 pointer-events-none" : ""}>
                  {solicitacoes.length === 0 && !loading && (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={32} className="text-muted opacity-40" />
                          <p className="text-muted text-sm">
                            {hasFilters ? "Nenhum resultado para os filtros aplicados" : "Nenhuma solicitação cadastrada"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {solicitacoes.map((s) => (
                    <tr key={s.idSolicitacao} className="border-t border-default hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {s.dataTreinamento?.slice(0, 10).split("-").reverse().join("/")}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">{s.horarioInicio}</td>
                      <td className="px-4 py-3 font-medium max-w-[200px]">
                        <span className="line-clamp-1" title={s.tema}>{s.tema}</span>
                      </td>
                      <td className="px-4 py-3 text-muted max-w-[160px]">
                        <span className="line-clamp-1" title={s.processo}>{s.processo}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[140px]">
                        <span className="line-clamp-1 text-xs">{s.solicitante?.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">{s.setor?.nomeSetor || "—"}</td>
                      <td className="px-4 py-3 text-muted text-xs">{s.turno?.nomeTurno || "—"}</td>
                      <td className="px-4 py-3 text-center text-xs">{s.participantes?.length ?? 0}</td>
                      <td className="px-4 py-3"><StatusSolicitacaoBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted max-w-[140px]">
                        <span className="line-clamp-1">{s.decididoPor?.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/treinamentos/solicitacoes/${s.idSolicitacao}`)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#0A84FF] hover:text-[#409CFF] hover:underline transition-colors"
                        >
                          <FileText size={13} /> Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={(p) => setPage(p)} />
          </div>
        </main>
      </MainLayout>
    </div>
  );
}
