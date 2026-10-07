import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CircleCheck, RefreshCw, Search, SearchX, Users, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import Pagination from "../../components/Pagination";
import { AlocarEfetivoModal } from "../../components/mapaOperacional/AlocarEfetivoModal";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

const POLL_INTERVAL_MS = 20000;
const TURNOS = ["T1", "T2", "T3"];
const OPCOES_POR_PAGINA = [10, 25, 50];
const VISOES = { sem: "NAO_ALOCADOS", alocados: "ALOCADOS" };

const FOCO = "outline-none focus-visible:ring-2 focus-visible:ring-[#FA4C00]/70";

function Contagem({ valor, ativo }) {
  return (
    <span
      className={`ml-2 px-1.5 py-0.5 rounded-md text-xs tabular-nums ${
        ativo ? "bg-[#FA4C00]/15 text-[#FA4C00]" : "bg-surface-2 text-muted"
      }`}
    >
      {valor}
    </span>
  );
}

function LinhasEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Carregando colaboradores" className="divide-y divide-default">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5 animate-pulse motion-reduce:animate-none">
          <div className="space-y-2">
            <div className="h-3.5 w-44 rounded bg-surface-2" />
            <div className="h-3 w-20 rounded bg-surface-2" />
          </div>
          <div className="h-8 w-20 rounded-lg bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

function EstadoVazio({ icone, titulo, descricao, acao }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-6 py-14 text-muted">
      {icone}
      <p className="font-medium text-page">{titulo}</p>
      {descricao && <p className="text-sm text-muted max-w-sm">{descricao}</p>}
      {acao}
    </div>
  );
}

export default function Efetivo() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [turnoAtual, setTurnoAtual] = useState(null);
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(OPCOES_POR_PAGINA[0]);
  const [colaboradorModal, setColaboradorModal] = useState(null);
  const [erro, setErro] = useState(null);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [params, setParams] = useSearchParams();
  const topoDaLista = useRef(null);

  // Turno e visão ficam na URL: sobrevivem ao F5 e podem ser compartilhados.
  const turnoParam = params.get("turno");
  const turno = TURNOS.includes(turnoParam) ? turnoParam : turnoAtual;
  const visao = params.get("visao") === "alocados" ? VISOES.alocados : VISOES.sem;

  const atualizarParams = (mudancas) => {
    const proximo = new URLSearchParams(params);
    Object.entries(mudancas).forEach(([k, v]) => (v ? proximo.set(k, v) : proximo.delete(k)));
    setParams(proximo, { replace: true });
    setPagina(1);
  };

  useEffect(() => {
    MapaOperacionalAPI.obterTurnoAtual()
      .then((info) => setTurnoAtual(info.turno))
      .catch(() => setErro("Não foi possível carregar o turno atual"));
  }, []);

  const carregar = useCallback(async () => {
    if (!turno) return;
    try {
      setDados(await MapaOperacionalAPI.listarEfetivo(turno));
      setErro(null);
      setAtualizadoEm(new Date());
    } catch (e) {
      setErro(e.response?.data?.message || "Não foi possível carregar os colaboradores");
    }
  }, [turno]);

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

  const emTurnoAtual = turno === turnoAtual;
  // Resposta de outro turno ainda na tela enquanto a nova carrega: trata como carregando.
  const dadosDoTurno = dados && dados.turno === turno ? dados : null;

  const setores = useMemo(
    () => [...new Set((dadosDoTurno?.efetivo || []).map((e) => e.setor).filter(Boolean))].sort(),
    [dadosDoTurno]
  );

  const termo = busca.trim().toLowerCase();
  const filtrosAtivos = !!termo || !!setorFiltro;
  const lista = (dadosDoTurno?.efetivo || []).filter((e) => {
    if (visao === VISOES.alocados ? !e.alocacao : !!e.alocacao) return false;
    if (setorFiltro && e.setor !== setorFiltro) return false;
    if (!termo) return true;
    return e.nomeCompleto.toLowerCase().includes(termo) || e.opsId.toLowerCase().includes(termo);
  });

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  // Se a lista encolher (alguém foi alocado, filtro mudou), não fica numa página que não existe mais.
  const paginaAtual = Math.min(pagina, totalPaginas);
  const listaDaPagina = lista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  const limparFiltros = () => {
    setBusca("");
    setSetorFiltro("");
    setPagina(1);
  };

  const irParaPagina = (p) => {
    setPagina(p);
    // O seletor de página fica no rodapé: sem isso, a nova página abriria pelo fim.
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topoDaLista.current?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  };

  const colunaAcao = visao === VISOES.alocados ? "Alocado em" : "Ação";

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 xl:p-10 2xl:px-20 space-y-5 max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Operação · Label</p>
              <h1 className="text-2xl font-semibold">Colaboradores</h1>
              <p className="text-sm text-muted mt-0.5">Quem está presente no turno e onde cada um está alocado</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted tabular-nums" aria-live="polite">
                {atualizadoEm
                  ? `Atualizado às ${atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : ""}
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

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div role="tablist" aria-label="Turno" className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-default w-fit">
              {TURNOS.map((t) => {
                const ativo = turno === t;
                return (
                  <button
                    key={t}
                    role="tab"
                    type="button"
                    aria-selected={ativo}
                    onClick={() => atualizarParams({ turno: t })}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${FOCO} ${
                      ativo ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page hover:bg-surface-2"
                    }`}
                  >
                    {t}
                    {turnoAtual === t && <span className="ml-1.5 text-[10px] opacity-80">· agora</span>}
                  </button>
                );
              })}
            </div>
            {dadosDoTurno && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Users size={15} aria-hidden="true" />
                <span>
                  <b className="text-page tabular-nums">{dadosDoTurno.total}</b> presentes no {turno}
                </span>
              </p>
            )}
          </div>

          {!emTurnoAtual && turnoAtual && turno && (
            <div role="status" className="flex items-center justify-between gap-3 flex-wrap text-sm bg-surface border border-default rounded-xl px-4 py-3">
              <span className="text-muted">
                Você está consultando o {turno}. Só é possível alocar no turno atual ({turnoAtual}).
              </span>
              <button
                type="button"
                onClick={() => atualizarParams({ turno: turnoAtual })}
                className={`px-3 h-9 rounded-lg border border-default hover:bg-surface-2 font-medium cursor-pointer transition-colors ${FOCO}`}
              >
                Ir para {turnoAtual}
              </button>
            </div>
          )}

          {erro && (
            <div role="alert" className="flex items-center justify-between gap-3 flex-wrap text-sm rounded-xl px-4 py-3 border text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/30">
              <span>
                {erro}
                {dadosDoTurno && " — mostrando os últimos dados carregados."}
              </span>
              <button type="button" onClick={atualizarAgora} className={`px-3 h-9 rounded-lg border border-current font-medium cursor-pointer ${FOCO}`}>
                Tentar de novo
              </button>
            </div>
          )}

          <section ref={topoDaLista} aria-label="Lista de colaboradores" className="scroll-mt-24 bg-surface rounded-2xl border border-default overflow-hidden">
            <div className="px-4 pt-1 border-b border-default">
              <div role="tablist" aria-label="Visão da lista" className="flex gap-1 -mb-px">
                {[
                  { v: VISOES.sem, chave: "sem", rotulo: "Sem alocação", total: dadosDoTurno?.naoAlocados },
                  { v: VISOES.alocados, chave: "alocados", rotulo: "Alocados", total: dadosDoTurno?.alocados },
                ].map((a) => {
                  const ativo = visao === a.v;
                  return (
                    <button
                      key={a.v}
                      role="tab"
                      type="button"
                      aria-selected={ativo}
                      onClick={() => atualizarParams({ visao: a.chave === "sem" ? "" : a.chave })}
                      className={`px-4 h-12 text-sm font-medium border-b-2 transition-colors cursor-pointer ${FOCO} ${
                        ativo ? "border-[#FA4C00] text-page" : "border-transparent text-muted hover:text-page"
                      }`}
                    >
                      {a.rotulo}
                      {a.total != null && <Contagem valor={a.total} ativo={ativo} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap p-4 border-b border-default">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                  aria-label="Buscar por nome ou Ops ID"
                  placeholder="Buscar por nome ou Ops ID"
                  className={`w-full h-11 pl-10 pr-3 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder-muted ${FOCO}`}
                />
              </div>
              <select
                value={setorFiltro}
                onChange={(e) => {
                  setSetorFiltro(e.target.value);
                  setPagina(1);
                }}
                aria-label="Filtrar por setor"
                className={`h-11 px-3.5 bg-surface-2 border border-default rounded-xl text-sm text-page w-full sm:w-auto ${FOCO}`}
              >
                <option value="">Todos os setores</option>
                {setores.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {filtrosAtivos && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className={`flex items-center gap-1.5 h-11 px-3 rounded-xl text-sm text-muted hover:text-page hover:bg-surface-2 cursor-pointer transition-colors ${FOCO}`}
                >
                  <X size={14} aria-hidden="true" /> Limpar filtros
                </button>
              )}
            </div>

            {!dadosDoTurno && !erro ? (
              <LinhasEsqueleto />
            ) : !dadosDoTurno ? null : lista.length === 0 ? (
              filtrosAtivos ? (
                <EstadoVazio
                  icone={<SearchX size={28} aria-hidden="true" />}
                  titulo="Nenhum colaborador encontrado"
                  descricao="Nenhum resultado para os filtros aplicados nesta visão."
                  acao={
                    <button
                      type="button"
                      onClick={limparFiltros}
                      className={`mt-2 px-4 h-10 rounded-xl border border-default hover:bg-surface-2 text-sm font-medium cursor-pointer transition-colors ${FOCO}`}
                    >
                      Limpar filtros
                    </button>
                  }
                />
              ) : dadosDoTurno.total === 0 ? (
                <EstadoVazio icone={<Users size={28} aria-hidden="true" />} titulo={`Ninguém presente no ${turno}`} descricao="Os colaboradores aparecem aqui quando a presença (P) é registrada." />
              ) : visao === VISOES.sem ? (
                <EstadoVazio icone={<CircleCheck size={28} aria-hidden="true" />} titulo="Todos os presentes estão alocados" descricao={`Não há ninguém sem alocação no ${turno}.`} />
              ) : (
                <EstadoVazio icone={<Users size={28} aria-hidden="true" />} titulo="Ninguém alocado ainda" descricao={`Ninguém do ${turno} foi alocado até agora.`} />
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted uppercase tracking-wide">
                      <th scope="col" className="text-left font-medium px-4 py-3">Colaborador</th>
                      <th scope="col" className="text-left font-medium px-4 py-3 hidden lg:table-cell">Cargo</th>
                      <th scope="col" className="text-left font-medium px-4 py-3 hidden md:table-cell">Setor</th>
                      <th scope="col" className={`font-medium px-4 py-3 ${visao === VISOES.alocados ? "text-left" : "text-right"}`}>
                        {colunaAcao}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {listaDaPagina.map((e) => (
                      <tr key={e.opsId} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{e.nomeCompleto}</p>
                          <p className="text-xs text-muted tabular-nums">
                            {e.opsId}
                            <span className="md:hidden"> · {e.setor || "Sem setor"}</span>
                          </p>
                          {e.sinergia && (
                            <p
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-1.5 py-0.5"
                              style={{ color: e.sinergia.retornoPendente ? "#F59E0B" : "#FA4C00", background: e.sinergia.retornoPendente ? "#F59E0B1F" : "#FA4C001F" }}
                            >
                              Sinergia: {e.sinergia.origem} → {e.sinergia.destino}
                              {e.sinergia.funcao ? ` · ${e.sinergia.funcao}` : ""}
                              {e.sinergia.retornoPendente ? " · retorno pendente" : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted hidden lg:table-cell">{e.cargo || "—"}</td>
                        <td className="px-4 py-3 text-muted hidden md:table-cell">{e.setor || "—"}</td>
                        <td className={`px-4 py-3 ${visao === VISOES.alocados ? "" : "text-right"}`}>
                          {e.alocacao ? (
                            <span className="flex items-center gap-2 flex-wrap">
                              <span>{e.alocacao.descricao}</span>
                              {e.alocacao.origem === "AUTO" && (
                                <span className="text-[11px] font-medium text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded-md">
                                  Workstation
                                </span>
                              )}
                            </span>
                          ) : !emTurnoAtual ? (
                            <span className="text-muted" aria-label="Alocação indisponível fora do turno atual">—</span>
                          ) : e.contexto ? (
                            <button
                              type="button"
                              onClick={() => setColaboradorModal(e)}
                              aria-label={`Alocar ${e.nomeCompleto}`}
                              className={`h-11 md:h-9 px-4 rounded-lg border border-default bg-surface-2 hover:bg-[#FA4C00] hover:border-[#FA4C00] hover:text-white text-sm font-medium cursor-pointer transition-colors ${FOCO}`}
                            >
                              Alocar
                            </button>
                          ) : (
                            <span className="text-xs text-muted" title="Este setor não tem opções de alocação no Label">
                              Sem opções
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {dadosDoTurno && lista.length > 0 && (
            <Pagination
              page={paginaAtual}
              totalPages={totalPaginas}
              totalItems={lista.length}
              limit={porPagina}
              limitOptions={OPCOES_POR_PAGINA}
              onPageChange={irParaPagina}
              onLimitChange={(n) => {
                setPorPagina(n);
                setPagina(1);
              }}
            />
          )}
        </main>
      </MainLayout>

      {colaboradorModal && (
        <AlocarEfetivoModal
          colaborador={colaboradorModal}
          turno={turno}
          onClose={() => setColaboradorModal(null)}
          onAllocated={carregar}
        />
      )}
    </div>
  );
}
