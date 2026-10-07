import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Plus, Printer, ScanLine, Search, Send, SlidersHorizontal, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import Pagination from "../../components/Pagination";
import { Aviso, EstadoVazio, Esqueleto, PageHeader } from "../../components/mapaOperacional/ui";
import { BTN_PRIMARIO, BTN_SECUNDARIO, FOCO, INPUT } from "../../components/mapaOperacional/uiTokens";
import { StatusBadge } from "../../components/mapaOperacional/sinergia/StatusBadge";
import { TamanhoEtiquetaModal } from "../../components/mapaOperacional/sinergia/TamanhoEtiquetaModal";
import { NovaSinergiaModal } from "../../components/mapaOperacional/sinergia/NovaSinergiaModal";
import { DetalheSinergiaModal } from "../../components/mapaOperacional/sinergia/DetalheSinergiaModal";
import { CancelarModal, ProrrogarModal, RetornoManualModal } from "../../components/mapaOperacional/sinergia/ModaisDeAcao";
import {
  enviarEImprimir,
  enviarVariasEImprimir,
  finalizarEImprimir,
  imprimirQr,
  imprimirQrGrupo,
  imprimirVarias,
  reemitirEImprimir,
} from "../../components/mapaOperacional/sinergia/acoesSinergia";
import { STATUS_EM_ANDAMENTO, formatarDia, formatarDuracao, formatarHora } from "../../components/mapaOperacional/sinergia/status";
import { SinergiaInternaAPI } from "../../services/sinergiaInterna";

const POLL_INTERVAL_MS = 20000;
const OPCOES_POR_PAGINA = [10, 25, 50];
const SELECT = `${INPUT} appearance-auto`;

const ABAS = [
  { id: "ANDAMENTO", rotulo: "Em andamento", status: STATUS_EM_ANDAMENTO },
  { id: "AGUARDANDO_RETORNO", rotulo: "Aguardando retorno", status: ["AGUARDANDO_RETORNO"], destaque: true },
  { id: "SOLICITADA", rotulo: "Solicitadas", status: ["SOLICITADA"] },
  { id: "EM_DESLOCAMENTO", rotulo: "Em deslocamento", status: ["EM_DESLOCAMENTO"] },
  { id: "SINERGIA_ATIVA", rotulo: "Ativas", status: ["SINERGIA_ATIVA"] },
  { id: "FINALIZADA", rotulo: "Finalizadas", status: ["FINALIZADA"] },
  { id: "CANCELADA_EXPIRADA", rotulo: "Canceladas/Expiradas", status: ["CANCELADA", "EXPIRADA"] },
  { id: "TODAS", rotulo: "Todas", status: [] },
];

const FILTROS_VAZIOS = { colaborador: "", idAreaOrigem: "", idAreaDestino: "", turno: "", motivo: "", diaOperacional: "", de: "", ate: "", responsavel: "" };

function contagemDaAba(aba, contagem) {
  if (!contagem) return null;
  if (aba.id === "TODAS") return Object.values(contagem).reduce((s, n) => s + n, 0);
  return aba.status.reduce((s, st) => s + (contagem[st] || 0), 0);
}

function AcaoPrincipal({ s, onAcao }) {
  const a = s.acoes;
  const botao = a.enviar
    ? { id: "enviar", rotulo: "Enviar", Icone: Send }
    : a.finalizar
      ? { id: "finalizar", rotulo: "Finalizar", Icone: null }
      : a.etiquetaIda
        ? { id: "imprimirIda", rotulo: s.idLote ? "QR do grupo" : "Imprimir QR", Icone: Printer }
        : a.etiquetaRetorno
          ? { id: "imprimirRetorno", rotulo: s.idLote ? "QR do grupo" : "QR retorno", Icone: Printer }
          : null;
  if (!botao) return null;
  const { Icone } = botao;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAcao(botao.id, s);
      }}
      aria-label={`${botao.rotulo} — ${s.colaborador.nomeCompleto}`}
      className={`h-11 md:h-9 px-3 rounded-lg border border-default bg-surface-2 hover:bg-[#FA4C00] hover:border-[#FA4C00] hover:text-white text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${FOCO}`}
    >
      {Icone && <Icone size={14} aria-hidden="true" />}
      {botao.rotulo}
    </button>
  );
}

export default function SinergiaInterna() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [meta, setMeta] = useState(null);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [atualizando, setAtualizando] = useState(false);

  const [abaId, setAbaId] = useState("ANDAMENTO");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [maisFiltros, setMaisFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(OPCOES_POR_PAGINA[1]);

  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const [modalNova, setModalNova] = useState(false);
  const [modalEtiqueta, setModalEtiqueta] = useState(false);
  const [detalheId, setDetalheId] = useState(null);
  const [versaoDetalhe, setVersaoDetalhe] = useState(0);
  const [modalAcao, setModalAcao] = useState(null); // { tipo, sinergia }
  const [processando, setProcessando] = useState(false);

  const aba = ABAS.find((a) => a.id === abaId);

  useEffect(() => {
    SinergiaInternaAPI.metadados()
      .then(setMeta)
      .catch((e) => setErro(e.response?.data?.message || "Não foi possível carregar o módulo."));
  }, []);

  // busca por texto com atraso, pra não consultar a cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(filtros.colaborador), 400);
    return () => clearTimeout(t);
  }, [filtros.colaborador]);

  const parametros = useMemo(() => {
    const p = { page: pagina, limit: porPagina };
    if (aba.status.length) p.status = aba.status.join(",");
    if (buscaDebounced.trim()) p.colaborador = buscaDebounced.trim();
    ["idAreaOrigem", "idAreaDestino", "turno", "motivo", "diaOperacional", "de", "ate", "responsavel"].forEach((k) => {
      if (filtros[k]) p[k] = filtros[k];
    });
    return p;
  }, [aba, buscaDebounced, filtros, pagina, porPagina]);

  const carregar = useCallback(async () => {
    try {
      setDados(await SinergiaInternaAPI.listar(parametros));
      setErro(null);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro(e.response?.data?.message || "Não foi possível carregar as sinergias.");
    }
  }, [parametros]);

  useEffect(() => {
    carregar();
    const intervalo = setInterval(() => {
      if (!document.hidden) carregar();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalo);
  }, [carregar]);

  const atualizarAgora = async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  };

  const alterarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
    setSelecionadas(new Set());
  };

  const filtrosAtivos = Object.values(filtros).some(Boolean);
  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setBuscaDebounced("");
    setPagina(1);
    setSelecionadas(new Set());
  };

  const trocarAba = (id) => {
    setAbaId(id);
    setPagina(1);
    setSelecionadas(new Set());
  };

  const recarregarTudo = async () => {
    setVersaoDetalhe((v) => v + 1);
    await carregar();
  };

  async function executarAcao(tipo, s) {
    if (["prorrogar", "retornoManual", "cancelar"].includes(tipo)) {
      setModalAcao({ tipo, sinergia: s });
      return;
    }
    setProcessando(true);
    try {
      let feito = false;
      if (tipo === "enviar") feito = await enviarEImprimir(s);
      else if (tipo === "imprimirIda") feito = s.idLote ? await imprimirQrGrupo(s.idLote, "ida") : await imprimirQr(s, "ida");
      else if (tipo === "imprimirRetorno") feito = s.idLote ? await imprimirQrGrupo(s.idLote, "retorno") : await imprimirQr(s, "retorno");
      else if (tipo === "imprimirIdaIndividual") feito = await imprimirQr(s, "ida");
      else if (tipo === "imprimirRetornoIndividual") feito = await imprimirQr(s, "retorno");
      else if (tipo === "finalizar") feito = await finalizarEImprimir(s);
      else if (tipo === "reemitirIda") feito = await reemitirEImprimir(s, "ida");
      else if (tipo === "reemitirRetorno") feito = await reemitirEImprimir(s, "retorno");
      if (feito) await recarregarTudo();
    } finally {
      setProcessando(false);
    }
  }

  const linhas = dados?.sinergias || [];
  const selecionadasObj = linhas.filter((s) => selecionadas.has(s.idSinergia));
  const enviaveis = selecionadasObj.filter((s) => s.acoes.enviar);
  const imprimiveis = selecionadasObj.filter((s) => s.acoes.etiquetaIda || s.acoes.etiquetaRetorno);
  const todasMarcadas = linhas.length > 0 && linhas.every((s) => selecionadas.has(s.idSinergia));

  const alternarLinha = (id) =>
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const alternarTodas = () => setSelecionadas(todasMarcadas ? new Set() : new Set(linhas.map((s) => s.idSinergia)));

  async function enviarSelecionadas() {
    setProcessando(true);
    try {
      if (await enviarVariasEImprimir(enviaveis)) {
        setSelecionadas(new Set());
        await recarregarTudo();
      }
    } finally {
      setProcessando(false);
    }
  }

  async function imprimirSelecionadas() {
    setProcessando(true);
    try {
      await imprimirVarias(imprimiveis);
    } finally {
      setProcessando(false);
    }
  }

  const pendentes = dados?.contagem?.AGUARDANDO_RETORNO ?? 0;

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 xl:p-10 2xl:px-20 space-y-5 max-w-[1600px] mx-auto">
          <PageHeader
            titulo="Sinergia Interna"
            subtitulo="Movimentação temporária de colaboradores entre áreas da Label, confirmada por QR Code"
            atualizadoEm={atualizadoEm}
            atualizando={atualizando}
            onAtualizar={atualizarAgora}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setModalNova(true)} disabled={!meta} className={BTN_PRIMARIO}>
              <Plus size={16} aria-hidden="true" /> Nova sinergia
            </button>
            <Link to="/operacao/label/sinergias/leitor?modo=chegada" className={BTN_SECUNDARIO}>
              <ScanLine size={16} aria-hidden="true" /> Confirmar chegada
            </Link>
            <Link to="/operacao/label/sinergias/leitor?modo=retorno" className={BTN_SECUNDARIO}>
              <ScanLine size={16} aria-hidden="true" /> Confirmar retorno
            </Link>
            <button type="button" onClick={() => setModalEtiqueta(true)} className={BTN_SECUNDARIO}>
              <Printer size={16} aria-hidden="true" /> Tamanho da etiqueta
            </button>
          </div>

          {erro && (
            <Aviso
              tipo="erro"
              acao={
                <button type="button" onClick={atualizarAgora} className={`${BTN_SECUNDARIO} h-9`}>
                  Tentar de novo
                </button>
              }
            >
              {erro}
              {dados && " Mostrando os últimos dados carregados."}
            </Aviso>
          )}

          {pendentes > 0 && abaId !== "AGUARDANDO_RETORNO" && (
            <Aviso
              tipo="alerta"
              acao={
                <button type="button" onClick={() => trocarAba("AGUARDANDO_RETORNO")} className={`${BTN_SECUNDARIO} h-9`}>
                  Ver retornos pendentes
                </button>
              }
            >
              {pendentes === 1 ? "1 colaborador" : `${pendentes} colaboradores`} ainda {pendentes === 1 ? "não teve" : "não tiveram"} o retorno confirmado e continuam
              na área de destino.
            </Aviso>
          )}

          <section aria-label="Lista de sinergias" className="bg-surface rounded-2xl border border-default overflow-hidden">
            <div className="px-3 sm:px-4 border-b border-default overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div role="tablist" aria-label="Status" className="flex gap-1 -mb-px min-w-max">
                {ABAS.map((a) => {
                  const ativo = a.id === abaId;
                  const n = contagemDaAba(a, dados?.contagem);
                  const alerta = a.destaque && n > 0;
                  return (
                    <button
                      key={a.id}
                      role="tab"
                      type="button"
                      aria-selected={ativo}
                      onClick={() => trocarAba(a.id)}
                      className={`px-3 h-12 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${FOCO} ${
                        ativo ? "border-[#FA4C00] text-page" : "border-transparent text-muted hover:text-page"
                      }`}
                    >
                      {a.rotulo}
                      {n != null && (
                        <span
                          className={`ml-1.5 px-1.5 py-0.5 rounded-md text-xs tabular-nums ${
                            alerta ? "bg-[#F59E0B]/20 text-[#F59E0B]" : ativo ? "bg-[#FA4C00]/15 text-[#FA4C00]" : "bg-surface-2 text-muted"
                          }`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-b border-default space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input
                    type="search"
                    value={filtros.colaborador}
                    onChange={(e) => alterarFiltro("colaborador", e.target.value)}
                    aria-label="Buscar por colaborador, Ops ID ou matrícula"
                    placeholder="Colaborador, Ops ID ou matrícula"
                    className={`${INPUT} pl-10`}
                  />
                </div>
                <select value={filtros.idAreaOrigem} onChange={(e) => alterarFiltro("idAreaOrigem", e.target.value)} aria-label="Setor de origem" className={`${SELECT} sm:w-44`}>
                  <option value="">Origem: todas</option>
                  {meta?.areas.map((a) => (
                    <option key={a.idArea} value={a.idArea}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <select value={filtros.idAreaDestino} onChange={(e) => alterarFiltro("idAreaDestino", e.target.value)} aria-label="Setor de destino" className={`${SELECT} sm:w-44`}>
                  <option value="">Destino: todos</option>
                  {meta?.areas.map((a) => (
                    <option key={a.idArea} value={a.idArea}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <select value={filtros.turno} onChange={(e) => alterarFiltro("turno", e.target.value)} aria-label="Turno" className={`${SELECT} sm:w-32`}>
                  <option value="">Turno</option>
                  {["T1", "T2", "T3"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setMaisFiltros((v) => !v)}
                  aria-expanded={maisFiltros}
                  className={`h-11 px-3.5 rounded-xl border border-default text-sm text-muted hover:text-page hover:bg-surface-2 inline-flex items-center gap-2 cursor-pointer transition-colors ${FOCO}`}
                >
                  <SlidersHorizontal size={15} aria-hidden="true" /> Mais filtros
                  <ChevronDown size={14} className={`transition-transform motion-reduce:transition-none ${maisFiltros ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {filtrosAtivos && (
                  <button type="button" onClick={limparFiltros} className={`h-11 px-3 rounded-xl text-sm text-muted hover:text-page hover:bg-surface-2 inline-flex items-center gap-1.5 cursor-pointer ${FOCO}`}>
                    <X size={14} aria-hidden="true" /> Limpar
                  </button>
                )}
              </div>

              {maisFiltros && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-xs text-muted">Motivo</span>
                    <select value={filtros.motivo} onChange={(e) => alterarFiltro("motivo", e.target.value)} className={SELECT}>
                      <option value="">Todos</option>
                      {meta?.motivos.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-xs text-muted">Dia operacional</span>
                    <input type="date" value={filtros.diaOperacional} onChange={(e) => alterarFiltro("diaOperacional", e.target.value)} className={INPUT} />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-xs text-muted">Solicitadas de</span>
                    <input type="date" value={filtros.de} onChange={(e) => alterarFiltro("de", e.target.value)} className={INPUT} />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-xs text-muted">até</span>
                    <input type="date" value={filtros.ate} onChange={(e) => alterarFiltro("ate", e.target.value)} className={INPUT} />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-xs text-muted">Responsável (quem solicitou/confirmou)</span>
                    <input value={filtros.responsavel} onChange={(e) => alterarFiltro("responsavel", e.target.value)} placeholder="Nome do usuário" className={INPUT} />
                  </label>
                </div>
              )}
            </div>

            {selecionadas.size > 0 && (
              <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 bg-[#FA4C00]/10 border-b border-default">
                <p className="text-sm font-medium">
                  {selecionadas.size} {selecionadas.size === 1 ? "selecionada" : "selecionadas"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {enviaveis.length > 0 && (
                    <button type="button" onClick={enviarSelecionadas} disabled={processando} className={`${BTN_PRIMARIO} h-10`}>
                      <Send size={15} aria-hidden="true" /> Confirmar envio e imprimir ({enviaveis.length})
                    </button>
                  )}
                  {imprimiveis.length > 0 && (
                    <button type="button" onClick={imprimirSelecionadas} disabled={processando} className={`${BTN_SECUNDARIO} h-10`}>
                      <Printer size={15} aria-hidden="true" /> Imprimir QR ({imprimiveis.length})
                    </button>
                  )}
                  <button type="button" onClick={() => setSelecionadas(new Set())} className={`h-10 px-3 rounded-xl text-sm text-muted hover:text-page cursor-pointer ${FOCO}`}>
                    Limpar seleção
                  </button>
                </div>
              </div>
            )}

            {!dados ? (
              erro ? null : (
                <div aria-busy="true" aria-label="Carregando sinergias" className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Esqueleto key={i} className="h-14" />
                  ))}
                </div>
              )
            ) : linhas.length === 0 ? (
              <EstadoVazio
                icone={<ArrowRight size={28} aria-hidden="true" />}
                titulo={filtrosAtivos ? "Nenhuma sinergia encontrada" : "Nenhuma sinergia nesta visão"}
                descricao={filtrosAtivos ? "Nenhum resultado para os filtros aplicados." : "Use “Nova sinergia” para solicitar a movimentação de um colaborador."}
                acao={
                  filtrosAtivos ? (
                    <button type="button" onClick={limparFiltros} className={`${BTN_SECUNDARIO} h-10 mt-2`}>
                      Limpar filtros
                    </button>
                  ) : null
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted uppercase tracking-wide">
                      <th scope="col" className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={todasMarcadas}
                          onChange={alternarTodas}
                          aria-label="Selecionar todas desta página"
                          className="h-4 w-4 accent-[#FA4C00] cursor-pointer"
                        />
                      </th>
                      <th scope="col" className="text-left font-medium px-3 py-3">Colaborador</th>
                      <th scope="col" className="text-left font-medium px-3 py-3">Origem → Destino</th>
                      <th scope="col" className="text-left font-medium px-3 py-3 hidden xl:table-cell">Motivo</th>
                      <th scope="col" className="text-left font-medium px-3 py-3 hidden md:table-cell">Turno · Dia</th>
                      <th scope="col" className="text-left font-medium px-3 py-3">Status</th>
                      <th scope="col" className="text-left font-medium px-3 py-3 hidden lg:table-cell">Horários</th>
                      <th scope="col" className="relative text-right font-medium px-4 py-3"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {linhas.map((s) => (
                      <tr
                        key={s.idSinergia}
                        onClick={() => setDetalheId(s.idSinergia)}
                        className={`hover:bg-surface-2/50 transition-colors cursor-pointer ${s.status === "AGUARDANDO_RETORNO" ? "bg-[#F59E0B]/[0.06]" : ""}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selecionadas.has(s.idSinergia)}
                            onChange={() => alternarLinha(s.idSinergia)}
                            aria-label={`Selecionar ${s.colaborador.nomeCompleto}`}
                            className="h-4 w-4 accent-[#FA4C00] cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetalheId(s.idSinergia);
                            }}
                            className={`text-left font-medium hover:underline cursor-pointer ${FOCO}`}
                          >
                            {s.colaborador.nomeCompleto}
                          </button>
                          <p className="text-xs text-muted tabular-nums">
                            {s.colaborador.opsId}
                            {s.colaborador.matricula ? ` · ${s.colaborador.matricula}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            {s.origem.nome} <ArrowRight size={13} className="text-muted" aria-hidden="true" /> <b className="font-semibold">{s.destino.nome}</b>
                          </span>
                          {s.funcaoDescricao && <p className="text-xs text-muted">{s.funcaoDescricao}</p>}
                        </td>
                        <td className="px-3 py-3 text-muted hidden xl:table-cell">{s.motivoDescricao}</td>
                        <td className="px-3 py-3 text-muted hidden md:table-cell whitespace-nowrap tabular-nums">
                          {s.turno} · {formatarDia(s.diaOperacional)}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={s.status} />
                          {s.retornoManual && <p className="text-[11px] text-muted mt-1">retorno sem QR</p>}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted hidden lg:table-cell tabular-nums whitespace-nowrap">
                          <p>
                            Envio {formatarHora(s.dataEnvio)} · Chegada {formatarHora(s.dataChegada)}
                          </p>
                          {s.tempoEmSinergiaMin != null && <p>Em sinergia {formatarDuracao(s.tempoEmSinergiaMin)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <AcaoPrincipal s={s} onAcao={executarAcao} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {dados && dados.total > 0 && (
            <Pagination
              page={dados.page}
              totalPages={dados.totalPages}
              totalItems={dados.total}
              limit={porPagina}
              limitOptions={OPCOES_POR_PAGINA}
              onPageChange={setPagina}
              onLimitChange={(n) => {
                setPorPagina(n);
                setPagina(1);
              }}
            />
          )}
        </main>
      </MainLayout>

      {modalEtiqueta && <TamanhoEtiquetaModal onClose={() => setModalEtiqueta(false)} />}
      {modalNova && meta && <NovaSinergiaModal meta={meta} onClose={() => setModalNova(false)} onCriadas={carregar} />}

      {detalheId && <DetalheSinergiaModal idSinergia={detalheId} versao={versaoDetalhe} onClose={() => setDetalheId(null)} onAcao={executarAcao} />}

      {modalAcao?.tipo === "cancelar" && (
        <CancelarModal sinergia={modalAcao.sinergia} onClose={() => setModalAcao(null)} onFeito={recarregarTudo} />
      )}
      {modalAcao?.tipo === "prorrogar" && (
        <ProrrogarModal sinergia={modalAcao.sinergia} onClose={() => setModalAcao(null)} onFeito={recarregarTudo} />
      )}
      {modalAcao?.tipo === "retornoManual" && (
        <RetornoManualModal sinergia={modalAcao.sinergia} onClose={() => setModalAcao(null)} onFeito={recarregarTudo} />
      )}
    </div>
  );
}
