import { useEffect, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import { confirmDialog } from "../ConfirmDialog";
import { AbasSegmentadas, BuscaColaborador, Esqueleto } from "./ui";
import { BTN_SECUNDARIO, FOCO, FUNCOES_DOCA as FUNCOES_POR_OPERACAO } from "./uiTokens";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";
import { TimesAPI } from "../../services/times";


const CAMPO = `w-full h-10 px-3 bg-surface-2 border border-default rounded-lg text-sm text-page placeholder-muted ${FOCO}`;
const BOTAO_FORM = "flex-1 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-60";

function NovoTimeForm({ operacao, turno, onCriado, onCancelar }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("OPERACIONAL");
  const [salvando, setSalvando] = useState(false);

  async function criar() {
    if (!nome.trim()) return toast.error("Informe o nome do time");
    setSalvando(true);
    try {
      await TimesAPI.criar({ nome: nome.trim(), operacao, tipo, turno });
      toast.success("Time criado com sucesso");
      onCriado();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao criar time");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="bg-surface-2 rounded-xl p-3 space-y-2.5">
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && criar()}
        aria-label="Nome do time"
        placeholder="Nome do time"
        autoFocus
        className={`${CAMPO} bg-surface`}
      />
      <div className="flex gap-2">
        {operacao === "INBOUND" ? (
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo do time" className={`${CAMPO} bg-surface flex-1`}>
            <option value="OPERACIONAL">Operacional</option>
            <option value="FIFO">FIFO</option>
          </select>
        ) : (
          <div className="flex-1 h-10 px-3 bg-surface border border-default rounded-lg text-sm text-muted flex items-center">Operacional</div>
        )}
        <div className="w-16 h-10 bg-surface border border-default rounded-lg text-sm text-muted grid place-items-center">{turno}</div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className={`${BOTAO_FORM} bg-surface border border-default text-muted hover:text-page ${FOCO}`}>
          Cancelar
        </button>
        <button type="button" onClick={criar} disabled={salvando} className={`${BOTAO_FORM} bg-[#FA4C00] hover:bg-[#D84300] text-white ${FOCO}`}>
          {salvando ? "Criando…" : "Criar time"}
        </button>
      </div>
    </div>
  );
}

function AdicionarIntegranteForm({ time, onAdicionado, onCancelar }) {
  const [funcao, setFuncao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const funcoes = FUNCOES_POR_OPERACAO[time.operacao] || [];

  async function adicionar(opsId) {
    if (time.tipo !== "FIFO" && !funcao) return toast.error("Selecione a função");
    setSalvando(true);
    try {
      await TimesAPI.adicionarIntegrante(time.idTime, { opsId, funcao: time.tipo === "FIFO" ? undefined : funcao });
      toast.success("Integrante adicionado");
      onAdicionado();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao adicionar integrante");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="bg-surface rounded-xl p-3 space-y-3 border border-default">
      {time.tipo !== "FIFO" && (
        <div role="group" aria-label="Função do integrante" className="flex gap-2">
          {funcoes.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={funcao === f.value}
              onClick={() => setFuncao(f.value)}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${FOCO} ${
                funcao === f.value ? "bg-[#FA4C00] text-white" : "bg-surface-2 text-muted hover:text-page"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <BuscaColaborador
        contexto={time.operacao === "INBOUND" ? "RECEBIMENTO" : "EXPEDICAO"}
        turno={time.turno}
        onSelecionar={(c) => adicionar(c.opsId)}
        desabilitado={salvando}
      />
      <button type="button" onClick={onCancelar} className={`w-full h-9 text-sm text-muted hover:text-page rounded-lg cursor-pointer ${FOCO}`}>
        Fechar
      </button>
    </div>
  );
}

function EditarTimeForm({ time, onSalvo, onCancelar }) {
  const [nome, setNome] = useState(time.nome);
  const [tipo, setTipo] = useState(time.tipo);
  const [turno, setTurno] = useState(time.turno);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim()) return toast.error("Informe o nome do time");
    setSalvando(true);
    try {
      await TimesAPI.atualizar(time.idTime, { nome: nome.trim(), tipo, turno });
      toast.success("Time atualizado");
      onSalvo();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao atualizar time");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="bg-surface rounded-xl p-3 space-y-2.5 border border-default">
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && salvar()}
        aria-label="Nome do time"
        autoFocus
        className={CAMPO}
      />
      <div className="flex gap-2">
        {time.operacao === "INBOUND" ? (
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo do time" className={`${CAMPO} flex-1`}>
            <option value="OPERACIONAL">Operacional</option>
            <option value="FIFO">FIFO</option>
          </select>
        ) : (
          <div className="flex-1 h-10 px-3 bg-surface-2 border border-default rounded-lg text-sm text-muted flex items-center">Operacional</div>
        )}
        <select value={turno} onChange={(e) => setTurno(e.target.value)} aria-label="Turno do time" className={`${CAMPO} w-20`}>
          <option value="T1">T1</option>
          <option value="T2">T2</option>
          <option value="T3">T3</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className={`${BOTAO_FORM} bg-surface-2 border border-default text-muted hover:text-page ${FOCO}`}>
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={salvando} className={`${BOTAO_FORM} bg-[#FA4C00] hover:bg-[#D84300] text-white ${FOCO}`}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function TimeRow({ time, onAtualizado }) {
  const [aberto, setAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState(false);
  const funcoes = FUNCOES_POR_OPERACAO[time.operacao] || [];

  async function excluir() {
    const ok = await confirmDialog(`Excluir o time "${time.nome}"?`, { danger: true });
    if (!ok) return;
    try {
      await TimesAPI.excluir(time.idTime);
      toast.success("Time excluído");
      onAtualizado();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao excluir time");
    }
  }

  async function trocarFuncao(opsId, funcao) {
    try {
      await TimesAPI.atualizarIntegrante(time.idTime, opsId, { funcao });
      onAtualizado();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao trocar função");
    }
  }

  async function remover(opsId) {
    try {
      await TimesAPI.removerIntegrante(time.idTime, opsId);
      toast.success("Integrante removido");
      onAtualizado();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao remover integrante");
    }
  }

  return (
    <div className="bg-surface-2 rounded-xl">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className={`w-full min-h-[44px] px-3 flex items-center justify-between gap-2 rounded-xl cursor-pointer ${FOCO}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users size={14} className="text-muted shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium truncate">{time.nome}</span>
          <span className="text-xs text-muted tabular-nums shrink-0">{time.integrantes.length}</span>
          <span className="text-[11px] text-muted bg-surface px-1.5 py-0.5 rounded shrink-0">
            {time.tipo === "FIFO" ? "FIFO · " : ""}
            {time.turno}
          </span>
        </span>
        <ChevronDown size={15} className={`text-muted shrink-0 transition-transform motion-reduce:transition-none ${aberto ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {aberto && (
        <div className="px-3 pb-3 space-y-2">
          {editando ? (
            <EditarTimeForm
              time={time}
              onSalvo={() => {
                setEditando(false);
                onAtualizado();
              }}
              onCancelar={() => setEditando(false)}
            />
          ) : (
            <div className="flex items-center gap-1 -ml-2">
              <button type="button" onClick={() => setEditando(true)} className={`h-9 px-2 rounded-lg text-sm text-muted hover:text-page hover:bg-surface cursor-pointer inline-flex items-center gap-1.5 ${FOCO}`}>
                <Pencil size={13} aria-hidden="true" /> Editar
              </button>
              <button type="button" onClick={excluir} className={`h-9 px-2 rounded-lg text-sm text-muted hover:text-[#FF453A] hover:bg-[#FF453A]/10 cursor-pointer inline-flex items-center gap-1.5 ${FOCO}`}>
                <Trash2 size={13} aria-hidden="true" /> Excluir
              </button>
            </div>
          )}

          {time.integrantes.length === 0 ? (
            <p className="text-sm text-muted">Ninguém no time</p>
          ) : (
            <ul className="space-y-1">
              {time.integrantes.map((i) => (
                <li key={i.colaborador.opsId} className="flex items-center gap-2 text-sm">
                  <span className="truncate flex-1" title={i.colaborador.nomeCompleto}>{i.colaborador.nomeCompleto}</span>
                  {time.tipo !== "FIFO" && (
                    <select
                      value={i.funcao || ""}
                      onChange={(e) => trocarFuncao(i.colaborador.opsId, e.target.value)}
                      aria-label={`Função de ${i.colaborador.nomeCompleto}`}
                      className={`h-9 px-1.5 bg-surface border border-default rounded-lg text-xs text-muted ${FOCO}`}
                    >
                      {funcoes.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => remover(i.colaborador.opsId)}
                    aria-label={`Remover ${i.colaborador.nomeCompleto} do time`}
                    className={`h-9 w-9 grid place-items-center shrink-0 rounded-lg text-muted hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors cursor-pointer ${FOCO}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {adicionando ? (
            <AdicionarIntegranteForm
              time={time}
              onAdicionado={() => {
                setAdicionando(false);
                onAtualizado();
              }}
              onCancelar={() => setAdicionando(false)}
            />
          ) : (
            <button type="button" onClick={() => setAdicionando(true)} className={`${BTN_SECUNDARIO} h-9 w-full text-[#FA4C00]`}>
              <Plus size={14} aria-hidden="true" /> Adicionar colaborador
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SecaoOperacao({ titulo, operacao, turno, times, onAtualizado }) {
  const [criando, setCriando] = useState(false);
  const fifo = times.filter((t) => t.tipo === "FIFO");
  const operacionais = times.filter((t) => t.tipo !== "FIFO");

  return (
    <section aria-label={titulo} className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</h3>

      {times.length === 0 && !criando && <p className="text-sm text-muted">Nenhum time neste turno.</p>}
      {fifo.map((t) => (
        <TimeRow key={t.idTime} time={t} onAtualizado={onAtualizado} />
      ))}
      {operacionais.map((t) => (
        <TimeRow key={t.idTime} time={t} onAtualizado={onAtualizado} />
      ))}

      {criando ? (
        <NovoTimeForm
          operacao={operacao}
          turno={turno}
          onCriado={() => {
            setCriando(false);
            onAtualizado();
          }}
          onCancelar={() => setCriando(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCriando(true)}
          className={`w-full h-10 rounded-xl border border-dashed border-default text-sm text-muted hover:text-page hover:border-[#FA4C00]/60 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${FOCO}`}
        >
          <Plus size={14} aria-hidden="true" /> Novo time
        </button>
      )}
    </section>
  );
}

export function EquipesPanel({ refreshKey, onChanged }) {
  const [times, setTimes] = useState(null); // { turno, lista }
  const [turno, setTurno] = useState("T1");
  const [erro, setErro] = useState(false);
  const [carregouAtual, setCarregouAtual] = useState(false);

  // Abre no turno atual (se falhar, T1).
  useEffect(() => {
    MapaOperacionalAPI.obterTurnoAtual()
      .then((info) => setTurno(info.turno))
      .catch(() => {})
      .finally(() => setCarregouAtual(true));
  }, []);

  const carregar = async () => {
    try {
      const lista = await TimesAPI.listar({ turno });
      setTimes({ turno, lista });
      setErro(false);
    } catch {
      setTimes({ turno, lista: [] });
      setErro(true);
    }
  };

  useEffect(() => {
    if (!carregouAtual) return;
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, turno, carregouAtual]);

  function atualizar() {
    carregar();
    onChanged?.();
  }

  const pronto = times && times.turno === turno;
  const lista = pronto ? times.lista : [];

  return (
    <div className="space-y-4">
      <AbasSegmentadas
        rotulo="Turno das equipes"
        valor={turno}
        onChange={setTurno}
        opcoes={["T1", "T2", "T3"].map((t) => ({ valor: t, rotulo: t }))}
      />

      {!pronto ? (
        <div aria-busy="true" aria-label="Carregando equipes" className="space-y-2">
          <Esqueleto className="h-11" />
          <Esqueleto className="h-11" />
          <Esqueleto className="h-11" />
        </div>
      ) : (
        <div className="space-y-5">
          {erro && (
            <p role="alert" className="text-sm text-[#FF453A]">
              Não foi possível carregar as equipes.{" "}
              <button type="button" onClick={carregar} className={`underline cursor-pointer ${FOCO}`}>Tentar de novo</button>
            </p>
          )}
          <SecaoOperacao
            titulo="Equipes Recebimento"
            operacao="INBOUND"
            turno={turno}
            times={lista.filter((t) => t.operacao === "INBOUND")}
            onAtualizado={atualizar}
          />
          <SecaoOperacao
            titulo="Equipes Expedição"
            operacao="OUTBOUND"
            turno={turno}
            times={lista.filter((t) => t.operacao === "OUTBOUND")}
            onAtualizado={atualizar}
          />
        </div>
      )}
    </div>
  );
}
