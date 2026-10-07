import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Aviso, Modal } from "../ui";
import { BTN_PERIGO, BTN_PRIMARIO, BTN_SECUNDARIO, INPUT } from "../uiTokens";
import { SinergiaInternaAPI } from "../../../services/sinergiaInterna";
import { formatarDataHora, paraInputLocal } from "./status";

function Rodape({ onClose, salvando, children }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
      <button type="button" onClick={onClose} disabled={salvando} className={BTN_SECUNDARIO}>
        Voltar
      </button>
      {children}
    </div>
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

function useEnvio(executar, onFeito, onClose) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const enviar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      const mensagem = await executar();
      toast.success(mensagem);
      onFeito?.();
      onClose();
    } catch (e) {
      setErro(e.response?.data?.message || "Não foi possível concluir a ação.");
    } finally {
      setSalvando(false);
    }
  };
  return { salvando, erro, enviar };
}

export function CancelarModal({ sinergia, onClose, onFeito }) {
  const [motivo, setMotivo] = useState("");
  const { salvando, erro, enviar } = useEnvio(
    async () => {
      await SinergiaInternaAPI.cancelar(sinergia.idSinergia, motivo);
      return "Sinergia cancelada";
    },
    onFeito,
    onClose
  );

  return (
    <Modal kicker="Sinergia Interna" titulo="Cancelar sinergia" subtitulo={sinergia.colaborador.nomeCompleto} onClose={onClose} bloqueado={salvando} z="z-[70]">
      <p className="text-sm text-muted">O QR Code será invalidado imediatamente e o registro continua no histórico.</p>
      <Campo rotulo="Motivo do cancelamento">
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} autoFocus className={INPUT} />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Rodape onClose={onClose} salvando={salvando}>
        <button type="button" onClick={enviar} disabled={salvando || motivo.trim().length < 3} className={BTN_PERIGO}>
          {salvando && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          Cancelar sinergia
        </button>
      </Rodape>
    </Modal>
  );
}

export function ProrrogarModal({ sinergia, onClose, onFeito }) {
  // Sugestão: 2 h depois do maior entre o fim previsto atual e agora.
  const [novoFim, setNovoFim] = useState(() =>
    paraInputLocal(new Date(Math.max(new Date(sinergia.fimPrevisto).getTime(), Date.now()) + 2 * 3600 * 1000))
  );
  const [motivo, setMotivo] = useState("");
  const { salvando, erro, enviar } = useEnvio(
    async () => {
      await SinergiaInternaAPI.prorrogar(sinergia.idSinergia, { novoFimPrevisto: new Date(novoFim).toISOString(), motivo });
      return "Sinergia prorrogada";
    },
    onFeito,
    onClose
  );

  return (
    <Modal kicker="Sinergia Interna" titulo="Prorrogar sinergia" subtitulo={sinergia.colaborador.nomeCompleto} onClose={onClose} bloqueado={salvando} z="z-[70]">
      <p className="text-sm text-muted">
        Fim atual: <b className="text-page">{formatarDataHora(sinergia.fimPrevisto)}</b>.
        {sinergia.status === "AGUARDANDO_RETORNO" && " Como já aguarda retorno, a sinergia volta a ficar ativa e o QR de retorno atual é invalidado."}
      </p>
      <Campo rotulo="Novo fim previsto">
        <input type="datetime-local" value={novoFim} onChange={(e) => setNovoFim(e.target.value)} className={INPUT} />
      </Campo>
      <Campo rotulo="Motivo da prorrogação">
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} autoFocus className={INPUT} />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Rodape onClose={onClose} salvando={salvando}>
        <button type="button" onClick={enviar} disabled={salvando || !novoFim || motivo.trim().length < 3} className={BTN_PRIMARIO}>
          {salvando && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          Prorrogar
        </button>
      </Rodape>
    </Modal>
  );
}

export function RetornoManualModal({ sinergia, onClose, onFeito }) {
  const [justificativa, setJustificativa] = useState("");
  const { salvando, erro, enviar } = useEnvio(
    async () => {
      await SinergiaInternaAPI.retornoManual(sinergia.idSinergia, justificativa);
      return "Retorno confirmado manualmente";
    },
    onFeito,
    onClose
  );

  return (
    <Modal kicker="Sinergia Interna" titulo="Confirmar retorno sem QR" subtitulo={sinergia.colaborador.nomeCompleto} onClose={onClose} bloqueado={salvando} z="z-[70]">
      <Aviso tipo="alerta">
        Use só se o QR de retorno não puder ser lido (etiqueta perdida ou danificada) e o colaborador já estiver de volta em {sinergia.origem.nome}. Fica
        registrado em auditoria com a sua justificativa.
      </Aviso>
      <Campo rotulo="Justificativa (mínimo 10 caracteres)">
        <input value={justificativa} onChange={(e) => setJustificativa(e.target.value)} maxLength={300} autoFocus className={INPUT} />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Rodape onClose={onClose} salvando={salvando}>
        <button type="button" onClick={enviar} disabled={salvando || justificativa.trim().length < 10} className={BTN_PRIMARIO}>
          {salvando && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          Confirmar retorno
        </button>
      </Rodape>
    </Modal>
  );
}
