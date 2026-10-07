import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";
import { DocasAPI } from "../../services/docas";
import { TimesAPI } from "../../services/times";
import { LABORS_MANUAIS, FUNCOES_DOCA as FUNCOES } from "./uiTokens";
import { Modal } from "./ui";


const selectCls =
  "w-full h-11 px-3 bg-surface-2 border border-default rounded-xl text-sm text-page outline-none focus-visible:ring-2 focus-visible:ring-[#FA4C00]/70";

function BotaoConfirmar({ onClick, salvando }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={salvando}
      className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#FA4C00] hover:bg-[#D84300] disabled:opacity-60 disabled:cursor-wait text-white text-sm font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FA4C00]/70"
    >
      {salvando && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {salvando ? "Alocando…" : "Alocar"}
    </button>
  );
}

function Campo({ rotulo, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted">{rotulo}</span>
      {children}
    </label>
  );
}

// Destino especial do seletor: o pool FULL D+1 não é uma esteira com braços.
const DESTINO_FULL_D1 = "FULL_D1";

function AlocarEsteira({ colaborador, onFeito, salvando, setSalvando }) {
  const [esteiras, setEsteiras] = useState([]);
  const [idEsteira, setIdEsteira] = useState("");
  const [funcao, setFuncao] = useState("PACKING");
  const [bracoLado, setBracoLado] = useState("");

  useEffect(() => {
    MapaOperacionalAPI.listarEsteiras().then((lista) => {
      setEsteiras(lista);
      if (lista[0]) setIdEsteira(String(lista[0].idEsteira));
    });
  }, []);

  const fullD1 = idEsteira === DESTINO_FULL_D1;
  const esteira = esteiras.find((e) => String(e.idEsteira) === idEsteira);
  const bracos = (esteira?.bracos || []).filter((b) => b.habilitado);

  async function confirmar() {
    if (!idEsteira) return;

    if (fullD1) {
      setSalvando(true);
      try {
        await MapaOperacionalAPI.alocarFullD1({ opsId: colaborador.opsId });
        toast.success(`${colaborador.nomeCompleto} adicionado ao FULL D+1`);
        onFeito();
      } catch (e) {
        toast.error(e.response?.data?.message || "Erro ao adicionar no FULL D+1");
      } finally {
        setSalvando(false);
      }
      return;
    }

    const payload = { opsId: colaborador.opsId, labor: funcao };
    if (funcao === "PACKING" || funcao === "PESCA") {
      if (!bracoLado) return toast.error("Selecione o braço");
      if (bracoLado !== "sem") {
        const [braco, lado] = bracoLado.split("-");
        Object.assign(payload, { braco: Number(braco), lado });
      }
    }
    setSalvando(true);
    try {
      await MapaOperacionalAPI.alocar(Number(idEsteira), payload);
      toast.success(`${colaborador.nomeCompleto} alocado`);
      onFeito();
    } catch (e) {
      if (!e.tratado) toast.error(e.response?.data?.message || "Erro ao alocar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3">
      <Campo rotulo="Destino">
        <select value={idEsteira} onChange={(e) => { setIdEsteira(e.target.value); setBracoLado(""); }} className={selectCls}>
          {esteiras.map((e) => (
            <option key={e.idEsteira} value={e.idEsteira}>{e.nome}</option>
          ))}
          <option value={DESTINO_FULL_D1}>FULL D+1</option>
        </select>
      </Campo>
      {fullD1 ? (
        <p className="text-xs text-muted">Entra no pool do FULL D+1, sem braço e sem função.</p>
      ) : (
        <Campo rotulo="Função">
          <select value={funcao} onChange={(e) => { setFuncao(e.target.value); setBracoLado(""); }} className={selectCls}>
            <option value="PACKING">Packing (em um braço)</option>
            {LABORS_MANUAIS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </Campo>
      )}
      {!fullD1 && (funcao === "PACKING" || funcao === "PESCA") && (
        <Campo rotulo="Braço">
          <select value={bracoLado} onChange={(e) => setBracoLado(e.target.value)} className={selectCls}>
            <option value="">Selecione...</option>
            {funcao === "PESCA" && <option value="sem">Sem braço (definir depois)</option>}
            {bracos.map((b) => (
              <option key={`${b.numero}-${b.lado}`} value={`${b.numero}-${b.lado}`}>
                {b.numero}{b.lado}
              </option>
            ))}
          </select>
        </Campo>
      )}
      <BotaoConfirmar onClick={confirmar} salvando={salvando} />
    </div>
  );
}

function AlocarDocaOuTime({ colaborador, operacao, turno, onFeito, salvando, setSalvando }) {
  const [aba, setAba] = useState("doca");
  const [docas, setDocas] = useState([]);
  const [times, setTimes] = useState([]);
  const [numero, setNumero] = useState("");
  const [idTime, setIdTime] = useState("");
  // Quem veio por sinergia interna já tem a função escolhida na solicitação: vem sugerida.
  const funcaoDaSinergia = FUNCOES[operacao].find((f) => f.value === colaborador.sinergia?.funcaoDestino)?.value;
  const [funcao, setFuncao] = useState(funcaoDaSinergia || FUNCOES[operacao][0].value);

  useEffect(() => {
    DocasAPI.listar().then((r) =>
      setDocas(r.docas.filter((d) => !d.alocacao && (!d.operacao || d.operacao === operacao)))
    );
    TimesAPI.listar({ operacao, turno }).then(setTimes);
  }, [operacao, turno]);

  const timeSelecionado = times.find((t) => String(t.idTime) === idTime);
  const semFuncao = aba === "time" && timeSelecionado?.tipo === "FIFO";

  async function confirmar() {
    setSalvando(true);
    try {
      if (aba === "doca") {
        if (!numero) return toast.error("Selecione a doca");
        await DocasAPI.alocar(Number(numero), { operacao, opsId: colaborador.opsId, funcao });
      } else {
        if (!idTime) return toast.error("Selecione o time");
        await TimesAPI.adicionarIntegrante(Number(idTime), {
          opsId: colaborador.opsId,
          funcao: semFuncao ? undefined : funcao,
        });
      }
      toast.success(`${colaborador.nomeCompleto} alocado`);
      onFeito();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao alocar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Destino da alocação" className="flex gap-2 bg-surface-2 rounded-xl p-1">
        {[
          { v: "doca", l: "Doca" },
          { v: "time", l: "Time" },
        ].map((a) => (
          <button
            key={a.v}
            role="tab"
            type="button"
            aria-selected={aba === a.v}
            onClick={() => setAba(a.v)}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#FA4C00]/70 ${
              aba === a.v ? "bg-[#FA4C00] text-white" : "text-muted hover:text-page"
            }`}
          >
            {a.l}
          </button>
        ))}
      </div>

      {aba === "doca" ? (
        <Campo rotulo="Doca disponível">
          <select value={numero} onChange={(e) => setNumero(e.target.value)} className={selectCls}>
            <option value="">Selecione...</option>
            {docas.map((d) => (
              <option key={d.numero} value={d.numero}>
                Doca {d.numero}{d.sheet?.fisicamenteOcupada ? ` · veículo ${d.sheet.placa}` : ""}
              </option>
            ))}
          </select>
        </Campo>
      ) : (
        <>
          <Campo rotulo={`Time de ${operacao === "INBOUND" ? "Recebimento" : "Expedição"} (${turno})`}>
            <select value={idTime} onChange={(e) => setIdTime(e.target.value)} className={selectCls}>
              <option value="">Selecione...</option>
              {times.map((t) => (
                <option key={t.idTime} value={t.idTime}>
                  {t.nome}{t.tipo === "FIFO" ? " (FIFO)" : ""}
                </option>
              ))}
            </select>
          </Campo>
          {times.length === 0 && <p className="text-xs text-muted">Nenhum time cadastrado nesse turno.</p>}
          <p className="text-xs text-muted">
            Entra no time — conta como alocado quando o time estiver numa doca.
          </p>
        </>
      )}

      {!semFuncao && (
        <Campo rotulo="Função">
          <select value={funcao} onChange={(e) => setFuncao(e.target.value)} className={selectCls}>
            {FUNCOES[operacao].map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Campo>
      )}

      <BotaoConfirmar onClick={confirmar} salvando={salvando} />
    </div>
  );
}

export function AlocarEfetivoModal({ colaborador, turno, onClose, onAllocated }) {
  const [salvando, setSalvando] = useState(false);
  const operacao = useMemo(
    () => (colaborador.contexto === "RECEBIMENTO" ? "INBOUND" : colaborador.contexto === "EXPEDICAO" ? "OUTBOUND" : null),
    [colaborador.contexto]
  );

  function feito() {
    onAllocated?.();
    onClose();
  }

  const detalhes = [colaborador.cargo, colaborador.setor, turno].filter(Boolean).join(" · ");

  return (
    <Modal kicker="Alocar colaborador" titulo={colaborador.nomeCompleto} subtitulo={detalhes} onClose={onClose} bloqueado={salvando}>
      {colaborador.contexto === "ESTEIRA" ? (
        <AlocarEsteira colaborador={colaborador} onFeito={feito} salvando={salvando} setSalvando={setSalvando} />
      ) : operacao ? (
        <AlocarDocaOuTime colaborador={colaborador} operacao={operacao} turno={turno} onFeito={feito} salvando={salvando} setSalvando={setSalvando} />
      ) : (
        <p className="text-sm text-muted">Esse setor não tem opções de alocação no Label.</p>
      )}
    </Modal>
  );
}
