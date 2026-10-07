import { useState } from "react";
import { Loader2, MoveRight } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "./ui";
import { BTN_PERIGO, BTN_PRIMARIO, BTN_SECUNDARIO, FOCO, INPUT, rotuloPosicao } from "./uiTokens";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

const horaCurta = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

/**
 * Alternativa acessível ao arrastar: escolher o destino numa lista.
 * Também mostra por onde essa pesca passou hoje (rastreabilidade) e permite encerrar.
 */
export function MoverPescaModal({ esteira, pesca, nome, destinos, trilha, onClose, onChanged }) {
  const posicaoAtual = pesca.braco == null ? "sem" : `${pesca.braco}-${pesca.lado}`;
  const [escolhido, setEscolhido] = useState(posicaoAtual);
  const [salvando, setSalvando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const ocupado = salvando || encerrando;

  async function mover() {
    if (escolhido === posicaoAtual) return;
    setSalvando(true);
    try {
      const [braco, lado] = escolhido === "sem" ? [null, null] : escolhido.split("-");
      await MapaOperacionalAPI.moverAlocacao(esteira.idEsteira, pesca.idAlocacao, { braco: braco && Number(braco), lado });
      toast.success(`${nome} movida para ${escolhido === "sem" ? "sem braço" : `o braço ${escolhido.replace("-", "")}`}`);
      await onChanged?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Não foi possível mover a pesca");
      await onChanged?.();
    } finally {
      setSalvando(false);
    }
  }

  async function encerrar() {
    setEncerrando(true);
    try {
      await MapaOperacionalAPI.encerrarAlocacao(esteira.idEsteira, pesca.idAlocacao);
      toast.success("Alocação encerrada");
      await onChanged?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Erro ao encerrar alocação");
    } finally {
      setEncerrando(false);
    }
  }

  return (
    <Modal kicker={`${esteira.nome} · Pesca`} titulo={nome} subtitulo={`Agora: ${rotuloPosicao(pesca.braco, pesca.lado)}`} onClose={onClose} bloqueado={ocupado}>
      <div className="space-y-1.5">
        <label htmlFor="destino-pesca" className="text-xs text-muted">
          Mover para
        </label>
        <select id="destino-pesca" value={escolhido} onChange={(e) => setEscolhido(e.target.value)} disabled={ocupado} className={INPUT}>
          {destinos.map((d) => (
            <option key={d.chave} value={d.chave}>
              {d.rotulo} {d.total ? `· ${d.total} ${d.total === 1 ? "pesca" : "pescas"}` : ""}
              {d.chave === posicaoAtual ? " (atual)" : ""}
            </option>
          ))}
        </select>
      </div>

      {trilha.length > 0 && (
        <div>
          <h3 className="text-xs text-muted uppercase tracking-wide mb-2">Passagens de hoje</h3>
          <ol className="rounded-xl border border-default divide-y divide-default max-h-48 overflow-y-auto">
            {trilha.map((t) => (
              <li key={t.idAlocacao} className="px-3.5 py-2.5 text-sm flex items-center justify-between gap-3">
                <span>
                  {rotuloPosicao(t.braco, t.lado)}
                  {t.registradoPor && <span className="block text-xs text-muted">por {t.registradoPor}</span>}
                </span>
                <span className="text-xs text-muted tabular-nums shrink-0">
                  {horaCurta(t.inicio)}
                  {t.fim ? ` – ${horaCurta(t.fim)}` : " – agora"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-1">
        <button type="button" onClick={encerrar} disabled={ocupado} className={BTN_PERIGO}>
          {encerrando && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          Encerrar alocação
        </button>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button type="button" onClick={onClose} disabled={ocupado} className={BTN_SECUNDARIO}>
            Cancelar
          </button>
          <button type="button" onClick={mover} disabled={ocupado || escolhido === posicaoAtual} className={`${BTN_PRIMARIO} ${FOCO}`}>
            {salvando ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <MoveRight size={15} aria-hidden="true" />}
            Mover
          </button>
        </div>
      </div>
    </Modal>
  );
}
