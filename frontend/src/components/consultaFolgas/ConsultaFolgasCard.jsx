import { useMemo, useState } from "react";
import {
  Search,
  AlertTriangle,
  CalendarDays,
  ArrowLeft,
  Loader2,
  List,
  Grid3x3,
  Sparkles,
} from "lucide-react";
import { ConsultaFolgasAPI } from "../../services/consultaFolgas";

function formatCpf(digits) {
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DIAS_SEMANA_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];

function formatDiaCompleto(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const data = new Date(Date.UTC(y, m - 1, d));
  return { dia: String(d).padStart(2, "0"), diaSemana: DIAS_SEMANA[data.getUTCDay()].toUpperCase() };
}

function fieldCls() {
  return "w-full pl-11 pr-4 py-3 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[#FA4C00] transition-shadow";
}

const TIPO_COLOR = {
  "Folga Dominical": { bg: "bg-[#FA4C00]/10", text: "text-[#FA4C00]", border: "border-[#FA4C00]/20", dot: "bg-[#FA4C00]" },
  "DSR Semanal": { bg: "bg-surface-2", text: "text-muted", border: "border-default", dot: "bg-muted" },
  "Troca de DSR": { bg: "bg-[#0A84FF]/10", text: "text-[#0A84FF]", border: "border-[#0A84FF]/20", dot: "bg-[#0A84FF]" },
  Folga: { bg: "bg-[#34C759]/10", text: "text-[#34C759]", border: "border-[#34C759]/20", dot: "bg-[#34C759]" },
};

function corDoTipo(tipo) {
  return TIPO_COLOR[tipo] || TIPO_COLOR["DSR Semanal"];
}

/* ─── Calendário mensal ────────────────────────────────────
   Grid de dias do mês com cores por tipo de folga. Cor nunca
   é a única pista: ao tocar/clicar num dia, o detalhe em texto
   aparece abaixo (acessível a leitor de tela e daltonismo).
──────────────────────────────────────────────────────────── */
function CalendarioFolgas({ ano, mes, folgas, hojeIso }) {
  const folgasPorDia = useMemo(() => {
    const map = new Map();
    folgas.forEach((f) => map.set(Number(f.data.slice(8, 10)), f));
    return map;
  }, [folgas]);

  const { celulas, totalDias } = useMemo(() => {
    const primeiroDiaSemana = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
    const totalDias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    const celulas = [];
    for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
    for (let d = 1; d <= totalDias; d++) celulas.push(d);
    return { celulas, totalDias };
  }, [ano, mes]);

  const hojeDia = hojeIso.slice(0, 7) === `${ano}-${String(mes).padStart(2, "0")}` ? Number(hojeIso.slice(8, 10)) : null;

  const diaInicialSelecionado = hojeDia && folgasPorDia.has(hojeDia) ? hojeDia : null;
  const [selecionado, setSelecionado] = useState(diaInicialSelecionado);

  const folgaSelecionada = selecionado ? folgasPorDia.get(selecionado) : null;
  const tiposPresentes = useMemo(() => {
    const set = new Set(folgas.map((f) => f.tipo));
    return Array.from(set);
  }, [folgas]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DIAS_SEMANA_CURTO.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-muted py-1">
            {d}
          </div>
        ))}

        {celulas.map((dia, i) => {
          if (dia === null) return <div key={`vazio-${i}`} />;

          const folga = folgasPorDia.get(dia);
          const isHoje = dia === hojeDia;
          const isSelecionado = dia === selecionado;
          const cor = folga ? corDoTipo(folga.tipo) : null;

          return (
            <button
              key={dia}
              type="button"
              onClick={() => setSelecionado(dia === selecionado ? null : dia)}
              className={[
                "relative aspect-square min-h-[38px] sm:min-h-[42px] rounded-lg text-xs font-medium transition-all cursor-pointer",
                "flex items-center justify-center",
                folga ? `${cor.bg} ${cor.text}` : "text-page hover:bg-surface-2",
                isSelecionado ? "ring-2 ring-[#FA4C00]" : isHoje ? "ring-1 ring-[#FA4C00]/60" : "",
              ].join(" ")}
              aria-pressed={isSelecionado}
              aria-label={
                folga
                  ? `Dia ${dia}, ${folga.tipo}${isHoje ? ", hoje" : ""}`
                  : `Dia ${dia}${isHoje ? ", hoje" : ""}, sem folga`
              }
            >
              {dia}
              {folga && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${cor.dot}`} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {tiposPresentes.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-default">
          {tiposPresentes.map((tipo) => {
            const cor = corDoTipo(tipo);
            return (
              <div key={tipo} className="flex items-center gap-1.5 pt-2">
                <span className={`w-2 h-2 rounded-full ${cor.dot}`} aria-hidden="true" />
                <span className="text-[11px] text-muted">{tipo}</span>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="min-h-[52px] rounded-xl bg-surface-2 px-4 py-3 flex items-center transition-opacity"
        aria-live="polite"
      >
        {folgaSelecionada ? (
          (() => {
            const { dia, diaSemana } = formatDiaCompleto(folgaSelecionada.data);
            const cor = corDoTipo(folgaSelecionada.tipo);
            return (
              <p className="text-sm text-page">
                <span className="font-semibold">{diaSemana}, dia {dia}</span>{" "}
                <span className={`${cor.text}`}>— {folgaSelecionada.tipo}</span>
              </p>
            );
          })()
        ) : selecionado ? (
          <p className="text-sm text-muted">Sem folga registrada neste dia.</p>
        ) : (
          <p className="text-sm text-muted">Toque em um dia para ver o detalhe.</p>
        )}
      </div>

      <p className="text-[11px] text-muted text-center">{totalDias} dias no mês</p>
    </div>
  );
}

export default function ConsultaFolgasCard() {
  const [cpf, setCpf] = useState("");
  const [opsId, setOpsId] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [view, setView] = useState("lista");

  const handleCpfChange = (e) => {
    setCpf(formatCpf(e.target.value.replace(/\D/g, "")));
  };

  const consultar = async (e) => {
    e.preventDefault();
    setErro(null);

    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11 || !opsId.trim()) {
      setErro("Preencha o CPF completo e o Ops ID.");
      return;
    }

    try {
      setLoading(true);
      const data = await ConsultaFolgasAPI.consultar(cpfDigits, opsId.trim());
      setResultado(data);
      setView("lista");
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível consultar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const novaConsulta = () => {
    setResultado(null);
    setErro(null);
    setCpf("");
    setOpsId("");
  };

  if (resultado) {
    const [ano, mes] = resultado.mesReferencia.split("-").map(Number);
    const nomeMes = MESES[mes - 1];
    const hojeIso = new Date().toISOString().slice(0, 10);
    const proxima = resultado.folgas.find((f) => f.data >= hojeIso) || null;
    const totalFolgas = resultado.folgas.length;

    return (
      <div className="space-y-5 animate-[fadeIn_.2s_ease-out]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-sm font-semibold text-[#FA4C00] shrink-0">
            {resultado.nomeCompleto?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-page truncate">{resultado.nomeCompleto}</p>
            <p className="text-xs text-muted">
              {[resultado.turno, resultado.setor].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted uppercase tracking-wide">
            Folgas de {nomeMes} de {ano}
          </p>

          <div className="flex items-center gap-0.5 bg-surface-2 rounded-lg p-0.5 shrink-0" role="tablist" aria-label="Modo de exibição">
            <button
              type="button"
              role="tab"
              aria-selected={view === "lista"}
              onClick={() => setView("lista")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                view === "lista" ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page"
              }`}
            >
              <List size={13} /> Lista
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "calendario"}
              onClick={() => setView("calendario")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                view === "calendario" ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page"
              }`}
            >
              <Grid3x3 size={13} /> Calendário
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-[#FA4C00]/25 bg-[#FA4C00]/5 p-3.5">
            <p className="text-[10px] font-semibold text-[#FA4C00] uppercase tracking-wide mb-1 flex items-center gap-1">
              <Sparkles size={11} /> Próxima folga
            </p>
            {proxima ? (
              (() => {
                const { dia, diaSemana } = formatDiaCompleto(proxima.data);
                return (
                  <p className="text-sm text-page leading-snug">
                    <span className="font-semibold">{diaSemana}, dia {dia}</span>
                  </p>
                );
              })()
            ) : (
              <p className="text-xs text-muted">Nenhuma no mês</p>
            )}
          </div>

          <div className="rounded-xl border border-default bg-surface-2 p-3.5">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Total no mês</p>
            <p className="text-sm text-page font-semibold">
              {totalFolgas} {totalFolgas === 1 ? "dia" : "dias"}
            </p>
          </div>
        </div>

        {resultado.folgas.length === 0 ? (
          <p className="text-sm text-muted bg-surface-2 rounded-xl px-4 py-6 text-center">
            Nenhuma folga registrada para este mês ainda.
          </p>
        ) : view === "calendario" ? (
          <CalendarioFolgas ano={ano} mes={mes} folgas={resultado.folgas} hojeIso={hojeIso} />
        ) : (
          <div className="space-y-2">
            {resultado.folgas.map((f, i) => {
              const { dia, diaSemana } = formatDiaCompleto(f.data);
              const cor = corDoTipo(f.tipo);
              const isHoje = f.data === hojeIso;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-3 min-h-[44px] ${
                    isHoje ? "ring-1 ring-[#FA4C00]/50" : ""
                  }`}
                >
                  <div className="text-center w-9 shrink-0">
                    <p className="text-sm font-semibold text-page leading-none">{dia}</p>
                    <p className="text-[9px] text-muted mt-1">{diaSemana}</p>
                  </div>
                  <div className="flex-1" />
                  {isHoje && (
                    <span className="text-[10px] font-medium text-[#FA4C00]">Hoje</span>
                  )}
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${cor.bg} ${cor.text} ${cor.border}`}>
                    {f.tipo}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={novaConsulta}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-default bg-surface hover:bg-surface-2 text-sm text-muted hover:text-page transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft size={15} /> Nova consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={consultar} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="consulta-cpf" className="text-xs font-medium text-muted">CPF</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="consulta-cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            className={fieldCls()}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="consulta-opsid" className="text-xs font-medium text-muted">Ops ID</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="consulta-opsid"
            type="text"
            autoComplete="off"
            placeholder="Ops123456"
            value={opsId}
            onChange={(e) => setOpsId(e.target.value)}
            className={fieldCls()}
          />
        </div>
      </div>

      {erro && (
        <div className="flex gap-2.5 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-3" role="alert" aria-live="assertive">
          <AlertTriangle size={15} className="text-[#FF453A] shrink-0 mt-0.5" />
          <p className="text-xs text-[#FF453A]">{erro}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FA4C00] hover:bg-[#ff5e1a] text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
        {loading ? "Consultando..." : "Consultar folgas"}
      </button>
    </form>
  );
}
