import { useEffect, useMemo, useState } from "react";
import { ChevronDown, History, Network, Pencil, Search, X } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import { Aviso, EstadoVazio, Esqueleto, FaixaIndicadores, PageHeader } from "../../components/mapaOperacional/ui";
import { BTN_SECUNDARIO, FOCO, INPUT } from "../../components/mapaOperacional/uiTokens";
import { FanoutChips } from "../../components/mapaOperacional/fanout/FanoutChips";
import { EditarFanoutModal } from "../../components/mapaOperacional/fanout/EditarFanoutModal";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

const ABA_SETUP = "setup";

// "Esteira FULL" é a Esteira C na operação; o nome do cadastro continua o mesmo.
const NOMES_DAS_ABAS = { "Esteira Termoplástica": "Termoplástica", "Esteira FULL": "Esteira C (FULL)" };
const nomeDaAba = (nome) => NOMES_DAS_ABAS[nome] || nome;

const formatarQuando = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const rotuloDaPosicao = (setup, braco, lado) => (setup ? `Posição ${braco}` : `Braço ${braco}${lado}`);

function CelulaFanout({ posicao, setup, destaque, onEditar, esmaecida }) {
  const { braco, lado, fanouts, habilitado } = posicao;
  const descricao = `${rotuloDaPosicao(setup, braco, lado)}${habilitado === false ? " (desabilitado)" : ""}`;
  return (
    <button
      type="button"
      onClick={() => onEditar(posicao)}
      aria-label={`Editar fanouts. ${descricao}. ${fanouts.length ? `Atuais: ${fanouts.join(", ")}.` : "Nenhum fanout."}`}
      className={`group w-full min-h-14 flex items-start justify-between gap-3 text-left px-4 py-3 cursor-pointer transition-colors motion-reduce:transition-none hover:bg-surface-2 ${FOCO} ${
        esmaecida ? "opacity-35" : ""
      } ${habilitado === false ? "bg-surface-2/50" : ""}`}
    >
      {fanouts.length ? (
        <FanoutChips fanouts={fanouts} destaque={destaque} compacto />
      ) : (
        <span className="text-sm text-muted pt-0.5">{habilitado === false ? "Braço desabilitado" : "Sem fanout"}</span>
      )}
      <Pencil size={14} aria-hidden="true" className="shrink-0 mt-1 text-muted opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  );
}

function descreverMudanca(h) {
  const antes = new Set(h.antes);
  const depois = new Set(h.depois);
  return {
    adicionados: h.depois.filter((c) => !antes.has(c)),
    removidos: h.antes.filter((c) => !depois.has(c)),
  };
}

const ROTULO_ACAO = { EDICAO: "Edição", MOVER_SAIDA: "Balanceamento (saiu)", MOVER_ENTRADA: "Balanceamento (entrou)", CARGA_INICIAL: "Carga inicial" };

function Historico({ escopo, idEsteira, versao }) {
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState(null);
  const setup = escopo === "SETUP_D1";

  useEffect(() => {
    if (!aberto) return undefined;
    let ativo = true;
    MapaOperacionalAPI.listarHistoricoFanouts({ escopo, idEsteira, limit: 60 })
      .then((r) => {
        if (!ativo) return;
        setLinhas(r);
        setErro(null);
      })
      .catch((e) => ativo && setErro(e.response?.data?.message || "Não foi possível carregar o histórico."));
    return () => {
      ativo = false;
    };
  }, [aberto, escopo, idEsteira, versao]);

  return (
    <section aria-labelledby="titulo-historico" className="rounded-2xl border border-default bg-surface">
      <h2 id="titulo-historico">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-sm font-medium cursor-pointer rounded-2xl ${FOCO}`}
        >
          <span className="flex items-center gap-2">
            <History size={16} className="text-muted" aria-hidden="true" /> Histórico de alterações
          </span>
          <ChevronDown size={16} aria-hidden="true" className={`text-muted transition-transform motion-reduce:transition-none ${aberto ? "rotate-180" : ""}`} />
        </button>
      </h2>
      {aberto && (
        <div className="border-t border-default">
          {erro ? (
            <p className="px-5 py-4 text-sm text-[#FF453A]">{erro}</p>
          ) : !linhas ? (
            <div className="p-5 space-y-2">
              <Esqueleto className="h-9" />
              <Esqueleto className="h-9" />
            </div>
          ) : linhas.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">Nenhuma alteração registrada.</p>
          ) : (
            <ol className="divide-y divide-default max-h-96 overflow-y-auto">
              {linhas.map((h) => {
                const { adicionados, removidos } = descreverMudanca(h);
                return (
                  <li key={h.idHistorico} className="px-5 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{rotuloDaPosicao(setup, h.braco, h.lado)}</span>
                        <span className="text-muted"> · {ROTULO_ACAO[h.acao] || h.acao}</span>
                      </p>
                      {h.acao === "CARGA_INICIAL" ? (
                        <p className="text-xs text-muted mt-0.5">{h.depois.length} fanouts cadastrados</p>
                      ) : (
                        <p className="mt-1 flex flex-wrap gap-1.5 font-mono text-[11px] font-semibold">
                          {adicionados.map((c) => (
                            <span key={`+${c}`} className="rounded px-1.5 py-0.5 bg-[#22C55E]/15 text-[#22C55E]" aria-label={`adicionou ${c}`}>
                              + {c}
                            </span>
                          ))}
                          {removidos.map((c) => (
                            <span key={`-${c}`} className="rounded px-1.5 py-0.5 bg-[#FF453A]/15 text-[#FF453A]" aria-label={`removeu ${c}`}>
                              − {c}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted tabular-nums shrink-0">
                      {formatarQuando(h.criadoEm)} · {h.usuarioNome || "—"}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

export default function Configuracao() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [esteiras, setEsteiras] = useState([]);
  const [aba, setAba] = useState(null);
  const [dados, setDados] = useState(null); // { chave, escopo, idEsteira, nome, posicoes, totais }
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState("");
  const [soSemFanout, setSoSemFanout] = useState(false);
  const [edicao, setEdicao] = useState(null);

  useEffect(() => {
    MapaOperacionalAPI.listarEsteiras()
      .then(setEsteiras)
      .catch(() => setErro("Não foi possível carregar as esteiras."));
  }, []);

  const abaAtual = aba ?? (esteiras[0] ? String(esteiras[0].idEsteira) : null);
  const setup = abaAtual === ABA_SETUP;

  useEffect(() => {
    if (!abaAtual) return undefined;
    let ativo = true;
    const params = abaAtual === ABA_SETUP ? { escopo: "SETUP_D1" } : { escopo: "ESTEIRA", idEsteira: abaAtual };
    MapaOperacionalAPI.listarFanouts(params)
      .then((r) => {
        if (!ativo) return;
        setDados({ ...r, chave: abaAtual });
        setErro(null);
      })
      .catch((e) => ativo && setErro(e.response?.data?.message || "Não foi possível carregar os fanouts."));
    return () => {
      ativo = false;
    };
  }, [abaAtual, versao]);

  const carregando = !dados || dados.chave !== abaAtual;
  const termo = busca.trim().toUpperCase();

  // Quem tem o fanout buscado (para o resumo "LPE-11 aparece em ...")
  const encontrados = useMemo(() => {
    if (!termo || carregando) return [];
    return dados.posicoes.filter((p) => p.fanouts.some((f) => f.includes(termo)));
  }, [termo, dados, carregando]);

  const abas = [
    ...esteiras.map((e) => ({ valor: String(e.idEsteira), rotulo: nomeDaAba(e.nome) })),
    { valor: ABA_SETUP, rotulo: "Setup D+1" },
  ];

  const linhas = useMemo(() => {
    if (carregando) return [];
    const porBraco = new Map();
    dados.posicoes.forEach((p) => {
      if (!porBraco.has(p.braco)) porBraco.set(p.braco, {});
      porBraco.get(p.braco)[p.lado] = p;
    });
    return [...porBraco.entries()].sort((a, b) => a[0] - b[0]).map(([braco, lados]) => ({ braco, lados }));
  }, [dados, carregando]);

  const visiveis = soSemFanout ? linhas.filter((l) => Object.values(l.lados).some((p) => p.fanouts.length === 0)) : linhas;
  const lados = setup ? ["A"] : ["A", "B"];
  const esmaecer = (p) => (termo ? !p.fanouts.some((f) => f.includes(termo)) : false);
  const recarregar = async () => setVersao((v) => v + 1);

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 xl:p-10 2xl:px-20 space-y-5 max-w-[1600px] mx-auto">
          <PageHeader
            titulo="Configuração de fanouts"
            subtitulo="Fanouts de cada braço, por esteira. Edite e balanceie; toda alteração fica registrada."
            onAtualizar={recarregar}
          />

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <div role="tablist" aria-label="Esteira" className="flex gap-1 bg-surface-2 rounded-xl p-1 w-max min-w-full sm:w-full">
              {abas.map((o) => (
                <button
                  key={o.valor}
                  role="tab"
                  type="button"
                  aria-selected={abaAtual === o.valor}
                  onClick={() => {
                    setAba(o.valor);
                    setBusca("");
                    setSoSemFanout(false);
                  }}
                  className={`flex-1 h-10 px-4 whitespace-nowrap rounded-lg text-sm font-medium transition-colors motion-reduce:transition-none cursor-pointer ${FOCO} ${
                    abaAtual === o.valor ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page"
                  }`}
                >
                  {o.rotulo}
                </button>
              ))}
            </div>
          </div>

          {erro && (
            <Aviso
              tipo="erro"
              acao={
                <button type="button" onClick={recarregar} className={`${BTN_SECUNDARIO} h-9`}>
                  Tentar de novo
                </button>
              }
            >
              {erro}
            </Aviso>
          )}

          {carregando ? (
            !erro && (
              <div className="space-y-4">
                <Esqueleto className="h-24" />
                <Esqueleto className="h-96" />
              </div>
            )
          ) : (
            <>
              {dados.totais.comFanout === 0 && (
                <Aviso>
                  Os fanouts {setup ? "do Setup D+1" : `da ${nomeDaAba(dados.nome)}`} ainda não foram definidos. Clique em uma célula abaixo para preencher.
                </Aviso>
              )}

              <FaixaIndicadores
                rotulo="Resumo dos fanouts"
                itens={[
                  { rotulo: setup ? "Posições com fanout" : "Braços com fanout", valor: `${dados.totais.comFanout} de ${dados.totais.posicoes}`, destaque: true },
                  { rotulo: "Fanouts distintos", valor: dados.totais.fanoutsDistintos },
                  {
                    rotulo: "Sem fanout",
                    valor: dados.totais.semFanout,
                    cor: dados.totais.semFanout > 0 ? "#F59E0B" : undefined,
                    apoio: dados.totais.semFanout > 0 ? "Posições a preencher" : "Tudo preenchido",
                  },
                ]}
              />

              <section aria-label="Fanouts por posição" className="rounded-2xl border border-default bg-surface overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 sm:px-5 py-4 border-b border-default">
                  <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                    <input
                      type="search"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value.toUpperCase())}
                      aria-label="Buscar fanout"
                      placeholder="Buscar fanout (ex.: LPE-11)"
                      autoComplete="off"
                      spellCheck={false}
                      className={`${INPUT} pl-10 font-mono tracking-wide`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoSemFanout((v) => !v)}
                    aria-pressed={soSemFanout}
                    className={`h-11 px-4 inline-flex items-center gap-2 rounded-xl border text-sm font-medium cursor-pointer transition-colors motion-reduce:transition-none ${FOCO} ${
                      soSemFanout ? "bg-[#FA4C00] border-[#FA4C00] text-white" : "bg-surface-2 border-default text-muted hover:text-page"
                    }`}
                  >
                    {soSemFanout && <X size={14} aria-hidden="true" />}
                    Só sem fanout
                  </button>
                  <p className="text-xs text-muted lg:ml-auto flex items-center gap-1.5">
                    <Pencil size={12} aria-hidden="true" /> Clique em uma célula para editar
                  </p>
                </div>

                {termo && (
                  <p role="status" className="px-4 sm:px-5 py-2.5 text-sm border-b border-default bg-surface-2/60">
                    {encontrados.length === 0 ? (
                      <>
                        <b className="font-mono">{termo}</b> não aparece em nenhuma posição.
                      </>
                    ) : (
                      <>
                        <b className="font-mono">{termo}</b> aparece em <b className="tabular-nums">{encontrados.length}</b>{" "}
                        {encontrados.length === 1 ? "posição" : "posições"}:{" "}
                        <span className="font-mono tabular-nums text-muted">{encontrados.map((p) => (setup ? p.braco : `${p.braco}${p.lado}`)).join(" · ")}</span>
                      </>
                    )}
                  </p>
                )}

                {visiveis.length === 0 ? (
                  <EstadoVazio
                    icone={<Network size={28} aria-hidden="true" />}
                    titulo={soSemFanout ? "Todas as posições têm fanout" : "Nenhuma posição cadastrada"}
                    descricao={soSemFanout ? "Desative o filtro para ver todas." : "Esta esteira não tem braços cadastrados."}
                  />
                ) : (
                  <>
                    {/* Tela larga: tabela */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <caption className="sr-only">Fanouts por {setup ? "posição" : "braço e lado"} da {dados.nome}</caption>
                        <thead>
                          <tr className="bg-surface-2/70 text-xs uppercase tracking-wide text-muted">
                            <th scope="col" className="w-24 px-5 py-2.5 text-left font-semibold">
                              {setup ? "Posição" : "Braço"}
                            </th>
                            {lados.map((l) => (
                              <th key={l} scope="col" className="px-4 py-2.5 text-left font-semibold">
                                {setup ? "Fanouts" : `Lado ${l}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-default">
                          {visiveis.map(({ braco, lados: porLado }) => (
                            <tr key={braco} className="align-top">
                              <th scope="row" className="px-5 py-3 text-left">
                                <span className="inline-grid place-items-center h-9 w-9 rounded-lg bg-surface-2 font-semibold tabular-nums">{braco}</span>
                              </th>
                              {lados.map((l) => (
                                <td key={l} className="p-0 border-l border-default align-top">
                                  {porLado[l] ? (
                                    <CelulaFanout posicao={porLado[l]} setup={setup} destaque={termo} esmaecida={esmaecer(porLado[l])} onEditar={setEdicao} />
                                  ) : (
                                    <span className="block px-4 py-3 text-muted">—</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Celular: um cartão por braço */}
                    <ul className="md:hidden divide-y divide-default">
                      {visiveis.map(({ braco, lados: porLado }) => (
                        <li key={braco} className="px-2 py-3">
                          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">{setup ? `Posição ${braco}` : `Braço ${braco}`}</p>
                          {lados.map((l) =>
                            porLado[l] ? (
                              <div key={l}>
                                {!setup && <p className="px-3 pt-1 text-[11px] text-muted">Lado {l}</p>}
                                <CelulaFanout posicao={porLado[l]} setup={setup} destaque={termo} esmaecida={esmaecer(porLado[l])} onEditar={setEdicao} />
                              </div>
                            ) : null
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              <Historico escopo={dados.escopo} idEsteira={dados.idEsteira} versao={versao} />
            </>
          )}
        </main>
      </MainLayout>

      {edicao && dados && (
        <EditarFanoutModal
          escopo={dados.escopo}
          idEsteira={dados.idEsteira}
          nomeAlvo={dados.nome}
          braco={edicao.braco}
          lado={edicao.lado}
          fanouts={edicao.fanouts}
          posicoes={dados.posicoes}
          onClose={() => setEdicao(null)}
          onSalvo={recarregar}
        />
      )}
    </div>
  );
}
