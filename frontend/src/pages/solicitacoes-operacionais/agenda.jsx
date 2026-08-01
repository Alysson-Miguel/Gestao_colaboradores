import { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  ArrowLeft, ChevronLeft, ChevronRight, ExternalLink,
  CalendarDays, Clock, CheckCircle2, XCircle, AlertTriangle,
  User, Briefcase, Building2, ArrowLeftRight,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import { Drawer } from "../../components/UIComponents/Drawer";
import { SolicitacoesOperacionaisAPI } from "../../services/solicitacoesOperacionais";
import { AuthContext } from "../../context/AuthContext";
import { StatusOperacionalBadge, TipoBadge, STATUS_COLOR, STATUS_LABEL, DESTINO_SINERGIA_LABEL, formatDateOnly } from "./shared";
import "../treinamentos/calendario.css";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});

const VIEW_OPTIONS = [
  { key: "month", label: "Mensal" },
  { key: "week", label: "Semanal" },
  { key: "agenda", label: "Agenda" },
];

const MESSAGES = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mensal",
  week: "Semanal",
  day: "Diário",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Solicitação",
  noEventsInRange: "Nenhuma solicitação neste período.",
  showMore: (total) => `+${total} mais`,
};

function toEventDate(dataStr) {
  return new Date(`${dataStr.slice(0, 10)}T00:00:00`);
}

/* ─── TOOLBAR CUSTOMIZADA ───────────────────────────── */
function CalendarToolbar({ label, onNavigate, onView, view }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5 bg-surface-2 rounded-xl p-1">
          <button onClick={() => onNavigate("PREV")} aria-label="Período anterior" className="p-2 rounded-lg text-muted hover:text-page hover:bg-surface-3 active:scale-95 transition-all cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => onNavigate("TODAY")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-page hover:bg-surface-3 active:scale-95 transition-all cursor-pointer">
            Hoje
          </button>
          <button onClick={() => onNavigate("NEXT")} aria-label="Próximo período" className="p-2 rounded-lg text-muted hover:text-page hover:bg-surface-3 active:scale-95 transition-all cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
        <h2 className="text-lg font-semibold capitalize">{label}</h2>
      </div>

      <div className="flex items-center gap-0.5 bg-surface-2 rounded-xl p-1 self-start sm:self-auto">
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.key}
            onClick={() => onView(v.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === v.key ? "bg-[#FA4C00] text-white shadow-sm shadow-[#FA4C00]/30" : "text-muted hover:text-page hover:bg-surface-3"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── CHIP DE EVENTO (Mensal/Semanal) ───────────────── */
function EventChip({ event }) {
  const cor = STATUS_COLOR[event.resource.status] || STATUS_COLOR.PENDENTE;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cor }} />
      <span className="truncate">{event.title}</span>
    </div>
  );
}

/* ─── LINHA DE EVENTO (Agenda) ──────────────────────── */
function AgendaEventRow({ event }) {
  const cor = STATUS_COLOR[event.resource.status] || STATUS_COLOR.PENDENTE;
  const s = event.resource;
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cor }} />
      <div className="min-w-0">
        <p className="font-semibold truncate" style={{ color: cor }}>{event.title}</p>
        <p className="text-xs text-muted truncate">
          {s.colaborador?.setor?.nomeSetor ? `${s.colaborador.setor.nomeSetor}` : ""}
          {s.colaborador?.turno?.nomeTurno ? ` • ${s.colaborador.turno.nomeTurno}` : ""}
        </p>
      </div>
    </div>
  );
}

/* ─── TILE DE INFORMAÇÃO (Drawer) ───────────────────── */
function InfoTile({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 bg-surface-2 rounded-xl p-3">
      <div className="p-1.5 rounded-lg bg-[#FA4C00]/10 text-[#FA4C00] shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-page truncate">{value ?? "—"}</p>
      </div>
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-default flex items-center justify-between">
      <div>
        <p className="text-xs text-muted mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      </div>
      <div className="p-2.5 rounded-xl" style={{ background: `${color}1A` }}>
        {icon}
      </div>
    </div>
  );
}

export default function AgendaSolicitacoesOperacionais() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selecionada, setSelecionada] = useState(null);

  const carregarEventos = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const inicio = format(start, "yyyy-MM-dd");
      const fim = format(end, "yyyy-MM-dd");
      const solicitacoes = await SolicitacoesOperacionaisAPI.calendario(inicio, fim);
      setEvents(
        (solicitacoes || []).map((s) => ({
          id: s.idSolicitacao,
          title: `${s.colaborador?.nomeCompleto || "—"}`,
          start: toEventDate(s.data),
          end: toEventDate(s.data),
          allDay: true,
          resource: s,
        }))
      );
    } catch (e) {
      if (e.response?.status === 401) { logout(); navigate("/login"); }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  const handleRangeChange = useCallback((range) => {
    let start, end;
    if (Array.isArray(range)) {
      start = range[0];
      end = range[range.length - 1];
    } else {
      start = range.start;
      end = range.end;
    }
    carregarEventos(start, end);
  }, [carregarEventos]);

  // carga inicial (mês corrente)
  useMemo(() => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    carregarEventos(start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirEvento = (event) => {
    setSelecionada(event.resource);
    setDrawerOpen(true);
  };

  const eventPropGetter = useCallback((event) => {
    const cor = STATUS_COLOR[event.resource.status] || STATUS_COLOR.PENDENTE;
    return {
      style: {
        backgroundColor: `${cor}1A`,
        color: cor,
        borderLeft: `3px solid ${cor}`,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        padding: "2px 6px",
      },
    };
  }, []);

  const counts = useMemo(() => {
    return events.reduce(
      (acc, e) => {
        const st = e.resource.status;
        acc[st] = (acc[st] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, PENDENTE: 0, APROVADA: 0, REPROVADA: 0 }
    );
  }, [events]);

  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6 md:p-8 space-y-6">
          {/* ── HEADER ── */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/solicitacoes-operacionais")} className="p-2.5 rounded-xl bg-surface-2 text-muted hover:text-page transition-all cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Agenda de Solicitações Operacionais</h1>
              <p className="text-sm text-muted mt-0.5">Visualize Folga, Banco de Horas, Sinergia e Troca de DSR por data</p>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CalendarDays size={22} className="text-[#FA4C00]" />} label="Total no período" value={counts.total} color="#FA4C00" />
            <StatCard icon={<Clock size={22} style={{ color: STATUS_COLOR.PENDENTE }} />} label="Pendentes" value={counts.PENDENTE} color={STATUS_COLOR.PENDENTE} />
            <StatCard icon={<CheckCircle2 size={22} style={{ color: STATUS_COLOR.APROVADA }} />} label="Aprovadas" value={counts.APROVADA} color={STATUS_COLOR.APROVADA} />
            <StatCard icon={<XCircle size={22} style={{ color: STATUS_COLOR.REPROVADA }} />} label="Reprovadas" value={counts.REPROVADA} color={STATUS_COLOR.REPROVADA} />
          </div>

          {/* ── LEGENDA ── */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(STATUS_LABEL).map(([status, label]) => (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                style={{ background: `${STATUS_COLOR[status]}14`, borderColor: `${STATUS_COLOR[status]}33`, color: STATUS_COLOR[status] }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
                {label}
              </span>
            ))}
          </div>

          {/* ── CALENDÁRIO ── */}
          <div className="bg-surface rounded-3xl border border-default p-4 sm:p-5 relative shadow-sm">
            {loading && (
              <div className="absolute top-5 right-5 flex items-center gap-1.5 text-xs text-muted bg-surface-2 px-2.5 py-1 rounded-full z-10">
                <div className="w-3 h-3 rounded-full border-2 border-[#FA4C00] border-t-transparent animate-spin" />
                Atualizando
              </div>
            )}
            <div className="rbc-dark-theme" style={{ height: 700 }}>
              <BigCalendar
                localizer={localizer}
                culture="pt-BR"
                messages={MESSAGES}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onRangeChange={handleRangeChange}
                views={["month", "week", "agenda"]}
                eventPropGetter={eventPropGetter}
                onSelectEvent={abrirEvento}
                components={{
                  toolbar: CalendarToolbar,
                  event: EventChip,
                  agenda: { event: AgendaEventRow },
                }}
                popup
              />
            </div>
          </div>
        </main>
      </MainLayout>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selecionada?.colaborador?.nomeCompleto || "Solicitação"}
        icon={<CalendarDays size={18} className="text-[#FA4C00]" />}
        footer={selecionada ? (
          <button
            onClick={() => navigate(`/solicitacoes-operacionais/${selecionada.idSolicitacao}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FA4C00]/10 hover:bg-[#FA4C00]/20 text-[#FA4C00] text-sm font-medium transition-colors cursor-pointer"
          >
            <ExternalLink size={15} /> Ver Detalhes Completos
          </button>
        ) : null}
      >
        {!selecionada ? null : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TipoBadge tipo={selecionada.tipo} />
              <StatusOperacionalBadge status={selecionada.status} />
            </div>

            {selecionada.status === "REPROVADA" && selecionada.motivo && (
              <div className="flex gap-2.5 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-3">
                <AlertTriangle size={15} className="text-[#FF453A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#FF453A]">Reprovada</p>
                  <p className="text-xs text-muted mt-0.5">{selecionada.decididoPor?.name ? `Por ${selecionada.decididoPor.name}` : ""}</p>
                </div>
              </div>
            )}

            {selecionada.tipo === "TROCA_DSR" && selecionada.colaborador2 && (
              <div className="flex items-center gap-2 bg-surface-2 rounded-xl p-3 text-xs">
                <ArrowLeftRight size={14} className="text-[#FA4C00] shrink-0" />
                <span>Troca com <strong>{selecionada.colaborador2.nomeCompleto}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <InfoTile icon={<User size={15} />} label="Colaborador" value={selecionada.colaborador?.nomeCompleto} />
              <InfoTile icon={<CalendarDays size={15} />} label="Data" value={formatDateOnly(selecionada.data)} />
              <InfoTile icon={<Building2 size={15} />} label="Setor" value={selecionada.colaborador?.setor?.nomeSetor} />
              <InfoTile icon={<Briefcase size={15} />} label="Turno" value={selecionada.colaborador?.turno?.nomeTurno} />
              {selecionada.tipo === "SINERGIA" && (
                <InfoTile icon={<Briefcase size={15} />} label="Destino" value={DESTINO_SINERGIA_LABEL[selecionada.sinergiaDestino]} />
              )}
              {selecionada.tipo === "BANCO_HORAS" && (
                <InfoTile icon={<Clock size={15} />} label="Modalidade" value={selecionada.bhDiaCompleto ? "Dia completo" : "Horas parciais"} />
              )}
            </div>

            {selecionada.motivo && (
              <div className="bg-surface-2 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Motivo</p>
                <p className="text-sm text-page">{selecionada.motivo}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
