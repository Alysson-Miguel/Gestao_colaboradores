import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  Clock,
  History,
  OctagonAlert,
  RefreshCw,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

const POLL_INTERVAL_MS = 20000;
const TURNOS = ["T1", "T2", "T3"];
const VISOES = [...TURNOS, "DIA"];

const COR = {
  ok: "#22C55E",
  atencao: "#F59E0B",
  critico: "#FF453A",
  acima: "#3B82F6",
  neutro: "#8B8B93",
};

const FOCO = "outline-none focus-visible:ring-2 focus-visible:ring-[#FA4C00]/70";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("pt-BR"));
const pad2 = (n) => String(n).padStart(2, "0");

function somarDias(iso, dias) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + dias);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function rotuloDia(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}

/**
 * Estado de um indicador. Sempre devolve ícone + texto, nunca só cor, pra
 * continuar legível sem distinguir vermelho/âmbar/verde.
 */
function statusDe(planejado, realizado) {
  if (realizado == null) return { chave: "AGUARDANDO", rotulo: "Aguardando", cor: COR.neutro, Icone: Clock, pct: null };
  if (!planejado) {
    return realizado > 0
      ? { chave: "SEM_PLANO_ALOCADO", rotulo: "Sem plano", cor: COR.atencao, Icone: TriangleAlert, pct: null }
      : { chave: "SEM_PLANO", rotulo: "Sem plano", cor: COR.neutro, Icone: CircleSlash, pct: null };
  }
  const pct = Math.round((realizado / planejado) * 100);
  if (pct > 110) return { chave: "ACIMA", rotulo: "Acima do plano", cor: COR.acima, Icone: TrendingUp, pct };
  if (pct >= 95) return { chave: "OK", rotulo: "No plano", cor: COR.ok, Icone: CircleCheck, pct };
  if (pct >= 70) return { chave: "ATENCAO", rotulo: "Atenção", cor: COR.atencao, Icone: TriangleAlert, pct };
  return { chave: "CRITICO", rotulo: "Crítico", cor: COR.critico, Icone: OctagonAlert, pct };
}

const soma = (porTurno, turnos) => turnos.reduce((s, t) => s + (porTurno?.[t] ?? 0), 0);

/**
 * Números do card na visão escolhida. No "Dia todo" o atingimento compara só
 * com os turnos que já começaram — senão o plano dos turnos futuros faz tudo
 * parecer crítico no meio do dia.
 */
function resumir(card, visao) {
  const planejadoTotalDia = card.planejado ? soma(card.planejado, TURNOS) : null;

  let planejado;
  let realizado;
  if (visao === "DIA") {
    const iniciados = TURNOS.filter((t) => card.realizado?.[t] != null);
    realizado = iniciados.length ? soma(card.realizado, iniciados) : null;
    planejado = card.planejado ? (iniciados.length ? soma(card.planejado, iniciados) : planejadoTotalDia) : null;
  } else {
    planejado = card.planejado?.[visao] ?? null;
    realizado = card.realizado?.[visao] ?? null;
  }

  const presentes = visao === "DIA" ? null : (card.presentes?.[visao] ?? null);
  const status = statusDe(planejado, realizado);
  const diferenca = planejado && realizado != null ? realizado - planejado : null;

  return { planejado, realizado, presentes, planejadoTotalDia, status, diferenca };
}

function textoDiferenca(diferenca) {
  if (diferenca == null) return null;
  if (diferenca === 0) return "Exatamente no plano";
  return diferenca < 0 ? `${Math.abs(diferenca)} abaixo do plano` : `${diferenca} acima do plano`;
}

function Selo({ status, grande = false }) {
  const { Icone, cor, rotulo, pct } = status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold whitespace-nowrap ${grande ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs"}`}
      style={{ color: cor, background: `${cor}1F` }}
    >
      <Icone size={grande ? 16 : 13} aria-hidden="true" />
      {rotulo}
      {pct != null && <span className="tabular-nums opacity-90">· {pct}%</span>}
    </span>
  );
}

function Barra({ pct, cor, alta = false, rotulo }) {
  const valor = Math.min(pct ?? 0, 100);
  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valor}
      className={`w-full rounded-full bg-surface-2 overflow-hidden ${alta ? "h-3" : "h-2"}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${valor}%`, background: cor }}
      />
    </div>
  );
}

function Fracao({ realizado, planejado, tamanho = "text-4xl" }) {
  return (
    <p className="tabular-nums leading-none" aria-label={`HC Real ${fmt(realizado)} de ${fmt(planejado)} planejados`}>
      <span className={`${tamanho} font-bold`}>{fmt(realizado)}</span>
      <span className="text-lg text-muted font-medium"> / {fmt(planejado)}</span>
    </p>
  );
}

function TabelaTurnos({ card }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">HC Real e planejado por turno</caption>
      <thead>
        <tr className="text-xs text-muted">
          <th scope="col" className="text-left font-medium pb-1.5">Turno</th>
          <th scope="col" className="text-right font-medium pb-1.5">Real / Plan.</th>
          <th scope="col" className="text-right font-medium pb-1.5">Atingimento</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-default">
        {TURNOS.map((t) => {
          const s = statusDe(card.planejado?.[t], card.realizado?.[t]);
          return (
            <tr key={t}>
              <td className="py-1.5 font-medium">{t}</td>
              <td className="py-1.5 text-right tabular-nums">
                {fmt(card.realizado?.[t])} <span className="text-muted">/ {fmt(card.planejado?.[t])}</span>
              </td>
              <td className="py-1.5 text-right">
                <span className="inline-flex items-center justify-end gap-1.5 tabular-nums" style={{ color: s.cor }}>
                  <s.Icone size={12} aria-hidden="true" />
                  {s.pct != null ? `${s.pct}%` : s.rotulo}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CardArea({ card, visao }) {
  const { planejado, realizado, status, diferenca, planejadoTotalDia } = resumir(card, visao);

  // Sem plano e sem ninguém alocado: não disputa atenção com o que importa.
  if (status.chave === "SEM_PLANO" && visao !== "DIA") {
    return (
      <section
        id={`card-${card.id}`}
        tabIndex={-1}
        aria-label={card.titulo}
        className="scroll-mt-24 outline-none bg-surface/60 rounded-2xl border border-default px-5 py-3.5 flex items-center justify-between gap-3"
      >
        <h2 className="text-sm font-medium text-muted">{card.titulo}</h2>
        <span className="text-xs text-muted">Sem HC planejado neste turno</span>
      </section>
    );
  }

  return (
    <section
      id={`card-${card.id}`}
      tabIndex={-1}
      aria-label={card.titulo}
      className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-[#FA4C00]/70 bg-surface rounded-2xl border border-default p-5 flex flex-col gap-3.5"
      style={status.chave === "CRITICO" ? { borderColor: `${COR.critico}66` } : undefined}
    >
      <header className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold">{card.titulo}</h2>
        <Selo status={status} />
      </header>

      <div>
        <Fracao realizado={realizado} planejado={planejado} />
        <p className="text-xs text-muted mt-1.5">HC Real / HC planejado{visao === "DIA" ? " (turnos iniciados)" : ""}</p>
      </div>

      <Barra pct={status.pct} cor={status.cor} rotulo={`Atingimento de ${card.titulo}`} />

      {status.chave === "SEM_PLANO_ALOCADO" ? (
        <p className="text-sm font-medium" style={{ color: status.cor }}>
          {realizado} alocado(s) sem HC planejado
        </p>
      ) : (
        diferenca != null && (
          <p className="text-sm font-medium" style={{ color: status.cor }}>
            {textoDiferenca(diferenca)}
          </p>
        )
      )}

      {card.lados && (
        <p className="text-xs text-muted">
          Planejado · Lado A{" "}
          <b className="text-page tabular-nums">{fmt(visao === "DIA" ? soma(card.lados.ladoA, TURNOS) : card.lados.ladoA[visao])}</b>
          {" · "}Lado B{" "}
          <b className="text-page tabular-nums">{fmt(visao === "DIA" ? soma(card.lados.ladoB, TURNOS) : card.lados.ladoB[visao])}</b>
        </p>
      )}

      {visao === "DIA" && (
        <div className="pt-1">
          <TabelaTurnos card={card} />
          {planejadoTotalDia != null && (
            <p className="text-xs text-muted mt-2">Plano do dia completo: {fmt(planejadoTotalDia)}</p>
          )}
        </div>
      )}
    </section>
  );
}

function Resumo({ geral, areas, visao, onIrPara }) {
  const { planejado, realizado, presentes, planejadoTotalDia, status, diferenca } = resumir(geral, visao);

  const atencao = useMemo(
    () =>
      areas
        .map((c) => ({ card: c, ...resumir(c, visao) }))
        .filter((a) => ["CRITICO", "ATENCAO", "SEM_PLANO_ALOCADO"].includes(a.status.chave))
        .sort((a, b) => (a.diferenca ?? 0) - (b.diferenca ?? 0)),
    [areas, visao]
  );

  const algumIniciado = realizado != null;

  return (
    <section aria-label="Resumo geral da Label" className="bg-surface rounded-2xl border border-default p-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Geral Label</h2>
          <Selo status={status} grande />
        </div>

        <div className="flex items-end gap-x-6 gap-y-2 flex-wrap">
          <div>
            <p className="text-6xl font-bold tabular-nums leading-none" style={{ color: status.pct != null ? status.cor : undefined }}>
              {status.pct != null ? `${status.pct}%` : "—"}
            </p>
            <p className="text-xs text-muted mt-2">do HC planejado</p>
          </div>
          <div className="pb-1">
            <Fracao realizado={realizado} planejado={planejado} tamanho="text-3xl" />
            <p className="text-xs text-muted mt-1.5">HC Real / HC planejado</p>
          </div>
        </div>

        <Barra pct={status.pct} cor={status.cor} alta rotulo="Atingimento geral" />

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <dt className="text-xs text-muted">Diferença</dt>
            <dd className="text-lg font-semibold tabular-nums" style={{ color: diferenca != null ? status.cor : undefined }}>
              {diferenca == null ? "—" : diferenca > 0 ? `+${diferenca}` : diferenca}
            </dd>
          </div>
          {visao !== "DIA" && (
            <div>
              <dt className="text-xs text-muted">Presentes (P)</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(presentes)}</dd>
            </div>
          )}
          {visao === "DIA" && planejadoTotalDia != null && (
            <div>
              <dt className="text-xs text-muted">Plano do dia completo</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(planejadoTotalDia)}</dd>
            </div>
          )}
        </dl>

        {visao === "DIA" && (
          <div className="pt-1">
            <TabelaTurnos card={geral} />
          </div>
        )}
      </div>

      <div className="lg:border-l lg:border-default lg:pl-6">
        <h3 className="text-sm font-semibold mb-3">Precisam de atenção</h3>
        {!algumIniciado ? (
          <p className="text-sm text-muted">Os números aparecem quando o turno começar.</p>
        ) : atencao.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-medium" style={{ color: COR.ok }}>
            <CircleCheck size={16} aria-hidden="true" /> Todas as áreas dentro do plano
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {atencao.map((a) => (
              <li key={a.card.id}>
                <button
                  type="button"
                  onClick={() => onIrPara(a.card.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl border border-default bg-surface-2/50 hover:bg-surface-2 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${FOCO}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <a.status.Icone size={16} style={{ color: a.status.cor }} aria-hidden="true" />
                    <span className="text-sm font-medium truncate">{a.card.titulo}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums whitespace-nowrap" style={{ color: a.status.cor }}>
                    {a.status.chave === "SEM_PLANO_ALOCADO" ? `${a.realizado} sem plano` : `${a.diferenca} HC`}
                    {a.status.pct != null && <span className="text-xs font-medium opacity-80"> · {a.status.pct}%</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Esqueleto() {
  const bloco = "bg-surface rounded-2xl border border-default animate-pulse motion-reduce:animate-none";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando painel">
      <div className={`${bloco} h-64`} />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${bloco} h-52`} />
        ))}
      </div>
    </div>
  );
}

export default function PainelExecutivo() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [painel, setPainel] = useState(null);
  const [erro, setErro] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [params, setParams] = useSearchParams();

  // Turno e dia ficam na URL: sobrevivem ao F5 e podem ser compartilhados.
  const data = params.get("data") || "";
  const visaoParam = params.get("turno");
  const visao = VISOES.includes(visaoParam) ? visaoParam : (painel?.turnoAtual ?? null);

  const atualizarParams = useCallback(
    (mudancas) => {
      const proximo = new URLSearchParams(params);
      Object.entries(mudancas).forEach(([k, v]) => (v ? proximo.set(k, v) : proximo.delete(k)));
      setParams(proximo, { replace: true });
    },
    [params, setParams]
  );

  const buscar = useCallback(async () => {
    try {
      const resultado = await MapaOperacionalAPI.obterPainelExecutivo(data || undefined);
      setPainel(resultado);
      setErro(null);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro(e.response?.data?.message || "Não foi possível carregar o painel");
    }
  }, [data]);

  useEffect(() => {
    buscar();
    const intervalo = setInterval(() => {
      if (!document.hidden) buscar();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalo);
  }, [buscar]);

  const atualizarAgora = async () => {
    setAtualizando(true);
    await buscar();
    setAtualizando(false);
  };

  const irParaCard = (id) => {
    const el = document.getElementById(`card-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    el.focus?.({ preventScroll: true });
  };

  const geral = painel?.cards.find((c) => c.id === "GERAL");
  const areas = painel?.cards.filter((c) => c.id !== "GERAL") || [];
  // Áreas sem plano e sem ninguém alocado viram cards compactos e vão pro fim
  // do grupo, pra não abrir buracos entre os cards que importam.
  const compacto = (c) => visao !== "DIA" && resumir(c, visao).status.chave === "SEM_PLANO";
  const ordenar = (lista) => [...lista].sort((a, b) => Number(compacto(a)) - Number(compacto(b)));
  const esteiras = visao ? ordenar(areas.filter((c) => c.tipo === "ESTEIRA")) : [];
  const operacoes = visao ? ordenar(areas.filter((c) => c.tipo === "OPERACAO")) : [];

  const diaExibido = data || painel?.diaOperacionalAtual || "";
  const noDiaAtual = !!painel && painel.dia === painel.diaOperacionalAtual;
  const trocandoDia = !!painel && !!diaExibido && painel.dia !== diaExibido;
  const diaPassado = !!painel && painel.dia < painel.diaOperacionalAtual;

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 xl:p-10 2xl:px-20 space-y-6 max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Operação · Label</p>
              <h1 className="text-2xl font-semibold">Painel Executivo</h1>
              <p className="text-sm text-muted mt-0.5">HC planejado x real por esteira, recebimento e expedição</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted tabular-nums" aria-live="polite">
                {atualizadoEm
                  ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Carregando…"}
              </p>
              <button
                type="button"
                onClick={atualizarAgora}
                disabled={atualizando}
                className={`flex items-center gap-2 px-4 h-11 rounded-xl bg-surface hover:bg-surface-2 border border-default text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${FOCO}`}
              >
                <RefreshCw size={14} className={atualizando ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
                Atualizar
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div role="tablist" aria-label="Turno" className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-default w-fit">
              {VISOES.map((v) => {
                const ativo = visao === v;
                return (
                  <button
                    key={v}
                    role="tab"
                    type="button"
                    aria-selected={ativo}
                    onClick={() => atualizarParams({ turno: v })}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${FOCO} ${
                      ativo ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page hover:bg-surface-2"
                    }`}
                  >
                    {v === "DIA" ? "Dia todo" : v}
                    {painel?.turnoAtual === v && noDiaAtual && <span className="ml-1.5 text-[10px] opacity-80">· agora</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-default w-fit">
              <button
                type="button"
                onClick={() => diaExibido && atualizarParams({ data: somarDias(diaExibido, -1) })}
                aria-label="Dia anterior"
                className={`h-9 w-9 grid place-items-center rounded-lg text-muted hover:text-page hover:bg-surface-2 cursor-pointer transition-colors ${FOCO}`}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <input
                type="date"
                value={diaExibido}
                onChange={(e) => e.target.value && atualizarParams({ data: e.target.value })}
                aria-label="Dia operacional"
                className={`h-9 px-2 bg-transparent text-sm text-page rounded-lg ${FOCO}`}
              />
              <button
                type="button"
                onClick={() => diaExibido && atualizarParams({ data: somarDias(diaExibido, 1) })}
                aria-label="Próximo dia"
                className={`h-9 w-9 grid place-items-center rounded-lg text-muted hover:text-page hover:bg-surface-2 cursor-pointer transition-colors ${FOCO}`}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            {!noDiaAtual && painel && (
              <button
                type="button"
                onClick={() => atualizarParams({ data: "" })}
                className={`h-11 px-4 rounded-xl border border-default bg-surface hover:bg-surface-2 text-sm font-medium cursor-pointer transition-colors ${FOCO}`}
              >
                Voltar para hoje
              </button>
            )}

            <span className="text-xs text-muted hidden md:inline">
              {diaExibido && `${rotuloDia(diaExibido)} · `}dia operacional: 06:00 às 05:59
            </span>
          </div>

          {erro && (
            <div role="alert" className="flex items-center justify-between gap-3 flex-wrap text-sm rounded-xl px-4 py-3 border" style={{ color: COR.critico, background: `${COR.critico}12`, borderColor: `${COR.critico}40` }}>
              <span>
                {erro}
                {painel && atualizadoEm && " — mostrando os últimos dados carregados."}
              </span>
              <button type="button" onClick={atualizarAgora} className={`px-3 h-9 rounded-lg border border-current font-medium cursor-pointer ${FOCO}`}>
                Tentar de novo
              </button>
            </div>
          )}

          {diaPassado && !erro && (
            <p className="flex items-center gap-2 text-sm text-muted bg-surface border border-default rounded-xl px-4 py-3">
              <History size={16} aria-hidden="true" /> Você está vendo um dia anterior. O HC Real mostra quem esteve alocado em cada turno.
            </p>
          )}

          {!painel ? (
            !erro && <Esqueleto />
          ) : (
            <div className={`space-y-6 transition-opacity motion-reduce:transition-none ${trocandoDia ? "opacity-50" : ""}`} aria-busy={trocandoDia}>
              {!painel.planejamentoEncontrado && (
                <p role="status" className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 border" style={{ color: COR.atencao, background: `${COR.atencao}14`, borderColor: `${COR.atencao}40` }}>
                  <TriangleAlert size={16} aria-hidden="true" />
                  Não encontrei HC planejado para este dia na planilha (aba Calculadora). O HC Real continua valendo.
                </p>
              )}

              {geral && <Resumo geral={geral} areas={areas} visao={visao} onIrPara={irParaCard} />}

              <section aria-labelledby="titulo-esteiras">
                <h2 id="titulo-esteiras" className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Esteiras</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start">
                  {esteiras.map((c) => (
                    <CardArea key={c.id} card={c} visao={visao} />
                  ))}
                </div>
              </section>

              <section aria-labelledby="titulo-operacoes">
                <h2 id="titulo-operacoes" className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Recebimento e Expedição</h2>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start">
                  {operacoes.map((c) => (
                    <CardArea key={c.id} card={c} visao={visao} />
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </MainLayout>
    </div>
  );
}
