import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Printer, Search, UserRound, Users, X } from "lucide-react";
import { AbasSegmentadas, Aviso, Modal } from "../ui";
import { BTN_PRIMARIO, BTN_SECUNDARIO, FOCO, INPUT } from "../uiTokens";
import { SinergiaInternaAPI } from "../../../services/sinergiaInterna";
import { enviarVariasEImprimir } from "./acoesSinergia";
import { paraInputLocal } from "./status";

const SELECT = `${INPUT} appearance-auto`;

function Campo({ rotulo, ajuda, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted">{rotulo}</span>
      {children}
      {ajuda && <span className="block text-xs text-muted">{ajuda}</span>}
    </label>
  );
}

/** Busca colaboradores movimentáveis; mostra quem já tem sinergia em aberto (e bloqueia a seleção). */
function BuscaParaSinergia({ selecionados, onAlternar, rotulo }) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const termo = busca.trim();
  const valido = termo.length >= 2;

  useEffect(() => {
    if (!valido) return undefined;
    let ativo = true;
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const lista = await SinergiaInternaAPI.buscarColaboradores(termo);
        if (ativo) setResultados(lista);
      } catch {
        if (ativo) setResultados([]);
      } finally {
        if (ativo) setBuscando(false);
      }
    }, 350);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [termo, valido]);

  const lista = valido ? resultados : [];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label={rotulo}
          placeholder="Buscar por nome, Ops ID ou matrícula"
          className={`${INPUT} pl-10 pr-10`}
        />
        {buscando && <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      </div>

      {!valido ? (
        <p className="text-xs text-muted">Digite ao menos 2 letras.</p>
      ) : lista.length === 0 ? (
        !buscando && <p className="text-sm text-muted">Nenhum colaborador encontrado.</p>
      ) : (
        <ul className="rounded-xl border border-default divide-y divide-default max-h-52 overflow-y-auto">
          {lista.map((c) => {
            const marcado = selecionados.some((s) => s.opsId === c.opsId);
            const bloqueado = !!c.sinergiaAberta;
            return (
              <li key={c.opsId}>
                <button
                  type="button"
                  disabled={bloqueado}
                  onClick={() => onAlternar(c)}
                  aria-pressed={marcado}
                  className={`w-full text-left px-3.5 py-2.5 min-h-[44px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-2 ${FOCO} ${marcado ? "bg-[#FA4C00]/10" : ""}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm truncate">{c.nomeCompleto}</span>
                      <span className="block text-xs text-muted truncate">
                        {c.opsId} · {c.setor || "Sem setor"} · {c.turno || "Sem turno"}
                      </span>
                    </span>
                    {bloqueado ? (
                      <span className="text-[11px] font-medium text-[#F59E0B] shrink-0">Já em sinergia</span>
                    ) : marcado ? (
                      <CheckCircle2 size={16} className="text-[#FA4C00] shrink-0" aria-label="Selecionado" />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function NovaSinergiaModal({ meta, onClose, onCriadas }) {
  const [modo, setModo] = useState("unitaria"); // unitaria | lote
  const [selecionados, setSelecionados] = useState([]);
  const [idAreaOrigem, setIdAreaOrigem] = useState("");
  const [idAreaDestino, setIdAreaDestino] = useState("");
  const [funcaoDestino, setFuncaoDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [complemento, setComplemento] = useState("");
  const [turno, setTurno] = useState(""); // "" = turno cadastrado de cada colaborador
  const [ajustarHorario, setAjustarHorario] = useState(false);
  const [inicio, setInicio] = useState(() => paraInputLocal(new Date()));
  const [fim, setFim] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [criadas, setCriadas] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const mesmaArea = idAreaOrigem && idAreaDestino && idAreaOrigem === idAreaDestino;
  // Onde a pessoa vai trabalhar no destino (o Full D+1 é pool e não pede função).
  const areaDestinoSelecionada = meta.areas.find((a) => String(a.idArea) === idAreaDestino);
  const funcoesDoDestino = areaDestinoSelecionada?.funcoes || [];

  const alternar = (colaborador) => {
    setErro(null);
    setSelecionados((atual) => {
      const jaTem = atual.some((s) => s.opsId === colaborador.opsId);
      if (modo === "unitaria") return jaTem ? [] : [colaborador];
      return jaTem ? atual.filter((s) => s.opsId !== colaborador.opsId) : [...atual, colaborador];
    });
    // a origem mais provável (alocação atual ou setor) vem preenchida; o usuário pode trocar
    if (!idAreaOrigem && colaborador.areaSugerida) setIdAreaOrigem(String(colaborador.areaSugerida));
  };

  const trocarModo = (novo) => {
    setModo(novo);
    if (novo === "unitaria") setSelecionados((atual) => atual.slice(0, 1));
  };

  const destinosPossiveis = useMemo(() => meta.areas.filter((a) => String(a.idArea) !== idAreaOrigem), [meta.areas, idAreaOrigem]);

  const podeSalvar =
    selecionados.length > 0 &&
    idAreaOrigem &&
    idAreaDestino &&
    !mesmaArea &&
    (funcoesDoDestino.length === 0 || funcaoDestino) &&
    motivo &&
    (motivo !== "OUTROS" || complemento.trim().length >= 3);

  async function solicitar() {
    setErro(null);
    if (mesmaArea) return setErro("O setor de origem e o setor de destino não podem ser iguais.");
    setSalvando(true);
    try {
      const resultado = await SinergiaInternaAPI.criar({
        opsIds: selecionados.map((s) => s.opsId),
        idAreaOrigem: Number(idAreaOrigem),
        idAreaDestino: Number(idAreaDestino),
        funcaoDestino: funcaoDestino || undefined,
        motivo,
        motivoComplemento: complemento.trim() || undefined,
        turno: turno || undefined,
        ...(ajustarHorario && inicio ? { inicioPrevisto: new Date(inicio).toISOString() } : {}),
        ...(ajustarHorario && fim ? { fimPrevisto: new Date(fim).toISOString() } : {}),
      });
      setCriadas(resultado);
      onCriadas?.();
    } catch (e) {
      setErro(e.response?.data?.message || "Não foi possível criar a solicitação.");
    } finally {
      setSalvando(false);
    }
  }

  // Atalho: confirma o envio de todas as criadas e já imprime as etiquetas (menos cliques no chão de operação).
  // Em lote (2+): uma única etiqueta de grupo; unitária: a etiqueta individual.
  async function enviarEImprimir() {
    setEnviando(true);
    await enviarVariasEImprimir(criadas);
    setEnviando(false);
    onCriadas?.();
    onClose();
  }

  if (criadas) {
    const todasEnviaveis = criadas.every((c) => c.acoes?.enviar);
    return (
      <Modal titulo="Solicitação criada" kicker="Sinergia Interna" onClose={onClose} bloqueado={enviando}>
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">
              {criadas.length === 1 ? "1 colaborador solicitado" : `${criadas.length} colaboradores solicitados`}
            </p>
            <p className="text-sm text-muted mt-0.5">
              {criadas[0].origem.nome} <ArrowRight size={12} className="inline" aria-hidden="true" /> {criadas[0].destino.nome}
              {criadas[0].funcaoDescricao ? ` · ${criadas[0].funcaoDescricao}` : ""}. A localização só muda quando o QR for lido no destino.
            </p>
          </div>
        </div>
        <ul className="rounded-xl border border-default divide-y divide-default max-h-40 overflow-y-auto text-sm">
          {criadas.map((c) => (
            <li key={c.idSinergia} className="px-3.5 py-2 flex justify-between gap-3">
              <span className="truncate">{c.colaborador.nomeCompleto}</span>
              <span className="text-xs text-muted shrink-0">{c.turno}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onClose} disabled={enviando} className={BTN_SECUNDARIO}>
            Concluir
          </button>
          {todasEnviaveis && (
            <button type="button" onClick={enviarEImprimir} disabled={enviando} className={BTN_PRIMARIO}>
              {enviando ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Printer size={15} aria-hidden="true" />}
              {enviando ? "Enviando…" : criadas.length > 1 ? "Confirmar envio e imprimir QR do grupo" : "Confirmar envio e imprimir QR"}
            </button>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal titulo="Nova sinergia interna" kicker="Sinergia Interna" onClose={onClose} bloqueado={salvando} largura="max-w-xl">
      <AbasSegmentadas
        rotulo="Tipo de solicitação"
        valor={modo}
        onChange={trocarModo}
        opcoes={[
          { valor: "unitaria", rotulo: "Unitária", icone: <UserRound size={14} aria-hidden="true" /> },
          { valor: "lote", rotulo: "Em lote", icone: <Users size={14} aria-hidden="true" /> },
        ]}
      />

      <div className="space-y-2">
        <p className="text-xs text-muted">{modo === "unitaria" ? "Colaborador" : "Colaboradores (selecione vários)"}</p>
        {selecionados.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Colaboradores selecionados">
            {selecionados.map((s) => (
              <li key={s.opsId} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-1 rounded-lg bg-surface-2 text-sm">
                <span className="truncate max-w-[200px]">{s.nomeCompleto}</span>
                <button
                  type="button"
                  onClick={() => alternar(s)}
                  aria-label={`Remover ${s.nomeCompleto}`}
                  className={`h-6 w-6 grid place-items-center rounded-md text-muted hover:text-[#FF453A] hover:bg-[#FF453A]/10 cursor-pointer ${FOCO}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Unitária: depois de escolher, a busca some (o × do chip permite trocar). */}
        {!(modo === "unitaria" && selecionados.length > 0) && (
          <BuscaParaSinergia selecionados={selecionados} onAlternar={alternar} rotulo={modo === "unitaria" ? "Buscar colaborador" : "Buscar colaboradores"} />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo rotulo="Setor de origem">
          <select
            value={idAreaOrigem}
            onChange={(e) => {
              setIdAreaOrigem(e.target.value);
              if (e.target.value === idAreaDestino) {
                setIdAreaDestino("");
                setFuncaoDestino("");
              }
            }}
            className={SELECT}
          >
            <option value="">Selecione…</option>
            {meta.areas.map((a) => (
              <option key={a.idArea} value={a.idArea}>
                {a.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Setor de destino">
          <select
            value={idAreaDestino}
            onChange={(e) => {
              setIdAreaDestino(e.target.value);
              setFuncaoDestino("");
            }}
            className={SELECT}
          >
            <option value="">Selecione…</option>
            {destinosPossiveis.map((a) => (
              <option key={a.idArea} value={a.idArea}>
                {a.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {funcoesDoDestino.length > 0 && (
        <Campo
          rotulo={`Função em ${areaDestinoSelecionada.nome}`}
          ajuda={
            funcaoDestino === "PACKING"
              ? "Packing: o colaborador entra automaticamente pelo check-in na Workstation."
              : areaDestinoSelecionada.contexto === "ESTEIRA"
                ? "Ao confirmar a chegada, ele já aparece nessa função na esteira."
                : "Ao chegar, aparece em Colaboradores já com essa função para o líder alocar na doca."
          }
        >
          <select value={funcaoDestino} onChange={(e) => setFuncaoDestino(e.target.value)} className={SELECT}>
            <option value="">Selecione…</option>
            {funcoesDoDestino.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo rotulo="Motivo">
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={SELECT}>
            <option value="">Selecione…</option>
            {meta.motivos.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Turno" ajuda={turno ? undefined : "Cada colaborador usa o turno do cadastro."}>
          <select value={turno} onChange={(e) => setTurno(e.target.value)} className={SELECT}>
            <option value="">Do cadastro do colaborador</option>
            {["T1", "T2", "T3"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {motivo && (
        <Campo rotulo={motivo === "OUTROS" ? "Descreva o motivo (obrigatório)" : "Observação (opcional)"}>
          <input value={complemento} onChange={(e) => setComplemento(e.target.value)} maxLength={300} className={INPUT} />
        </Campo>
      )}

      <div>
        <button
          type="button"
          onClick={() => setAjustarHorario((v) => !v)}
          aria-expanded={ajustarHorario}
          className={`text-sm text-muted hover:text-page underline-offset-2 hover:underline cursor-pointer ${FOCO}`}
        >
          {ajustarHorario ? "Usar o fim do turno cadastrado" : "Ajustar período previsto"}
        </button>
        {ajustarHorario ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Campo rotulo="Início previsto">
              <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={INPUT} />
            </Campo>
            <Campo rotulo="Fim previsto">
              <input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} className={INPUT} />
            </Campo>
          </div>
        ) : (
          <p className="text-xs text-muted mt-1.5">Início agora; fim no horário de término do turno cadastrado de cada colaborador.</p>
        )}
      </div>

      {mesmaArea && <Aviso tipo="erro">O setor de origem e o setor de destino não podem ser iguais.</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
        <button type="button" onClick={onClose} disabled={salvando} className={BTN_SECUNDARIO}>
          Cancelar
        </button>
        <button type="button" onClick={solicitar} disabled={!podeSalvar || salvando} className={BTN_PRIMARIO}>
          {salvando && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {salvando ? "Solicitando…" : selecionados.length > 1 ? `Solicitar ${selecionados.length} sinergias` : "Solicitar sinergia"}
        </button>
      </div>
    </Modal>
  );
}
