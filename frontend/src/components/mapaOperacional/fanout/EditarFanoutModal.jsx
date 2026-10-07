import { useState } from "react";
import { ArrowRightLeft, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { confirmDialog } from "../../ConfirmDialog";
import { Modal } from "../ui";
import { BTN_PRIMARIO, BTN_SECUNDARIO, FOCO, INPUT } from "../uiTokens";
import { MapaOperacionalAPI } from "../../../services/mapaOperacional";

const FORMATO_CODIGO = /^[A-Z0-9][A-Z0-9&_./-]{1,23}$/;
const MAX_POR_POSICAO = 30;

const mesmaLista = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const rotuloPosicao = (escopoSetup, braco, lado) => (escopoSetup ? `Posição ${braco}` : `Braço ${braco} · Lado ${lado}`);

/**
 * Edição dos fanouts de uma posição (braço/lado ou posição do Setup D+1) e balanceamento:
 * selecionar fanouts e levá-los para outra posição em uma operação só. Tudo vai para o histórico.
 */
export function EditarFanoutModal({ escopo, idEsteira, nomeAlvo, braco, lado, fanouts, posicoes, onClose, onSalvo }) {
  const setup = escopo === "SETUP_D1";
  const [lista, setLista] = useState(fanouts);
  const [entrada, setEntrada] = useState("");
  const [erroEntrada, setErroEntrada] = useState(null);
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [destino, setDestino] = useState("");
  const [ocupado, setOcupado] = useState(null); // "salvar" | "mover"

  const sujo = !mesmaLista(lista, fanouts);
  const outras = posicoes.filter((p) => !(p.braco === braco && p.lado === lado) && p.habilitado !== false);
  const base = { escopo, idEsteira };

  function adicionar() {
    const itens = entrada.split(/[\s,;]+/).map((t) => t.trim().toUpperCase()).filter((t) => t && t !== "-");
    if (!itens.length) return;
    const invalido = itens.find((t) => !FORMATO_CODIGO.test(t));
    if (invalido) return setErroEntrada(`"${invalido}" não é um fanout válido. Use letras, números e - (ex.: LPE-11, J&T).`);
    const novos = itens.filter((t, i) => !lista.includes(t) && itens.indexOf(t) === i);
    if (lista.length + novos.length > MAX_POR_POSICAO) return setErroEntrada(`No máximo ${MAX_POR_POSICAO} fanouts por posição.`);
    setErroEntrada(null);
    setLista([...lista, ...novos]);
    setEntrada("");
    if (novos.length < itens.length) toast("Alguns já estavam na lista.", { icon: "ℹ️" });
  }

  const remover = (codigo) => {
    setLista(lista.filter((c) => c !== codigo));
    setSelecionados((s) => {
      const n = new Set(s);
      n.delete(codigo);
      return n;
    });
  };

  const alternar = (codigo) =>
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(codigo)) n.delete(codigo);
      else n.add(codigo);
      return n;
    });

  async function fechar() {
    if (sujo && !(await confirmDialog("Descartar as alterações não salvas?", { confirmText: "Descartar", danger: true }))) return;
    onClose();
  }

  async function salvar() {
    setOcupado("salvar");
    try {
      await MapaOperacionalAPI.salvarFanouts({ ...base, braco, lado, fanouts: lista });
      toast.success("Fanouts atualizados");
      await onSalvo?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Não foi possível salvar os fanouts");
    } finally {
      setOcupado(null);
    }
  }

  async function mover() {
    const [b, l] = destino.split("-");
    setOcupado("mover");
    try {
      await MapaOperacionalAPI.moverFanouts({ ...base, de: { braco, lado }, para: { braco: Number(b), lado: l }, fanouts: [...selecionados] });
      toast.success(selecionados.size === 1 ? "Fanout movido" : `${selecionados.size} fanouts movidos`);
      await onSalvo?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Não foi possível mover os fanouts");
      await onSalvo?.();
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Modal
      kicker={nomeAlvo}
      titulo={rotuloPosicao(setup, braco, lado)}
      subtitulo={`${lista.length} ${lista.length === 1 ? "fanout" : "fanouts"}${sujo ? " · alterações não salvas" : ""}`}
      onClose={fechar}
      bloqueado={!!ocupado}
      largura="max-w-lg"
    >
      <div className="space-y-1.5">
        <label htmlFor="novo-fanout" className="text-xs text-muted">
          Adicionar fanouts
        </label>
        <div className="flex gap-2">
          <input
            id="novo-fanout"
            value={entrada}
            onChange={(e) => {
              setEntrada(e.target.value.toUpperCase());
              setErroEntrada(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionar();
              }
            }}
            placeholder="LPE-11, LPE-12, J&T"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!erroEntrada}
            aria-describedby="ajuda-fanout"
            autoFocus
            className={`${INPUT} font-mono tracking-wide`}
          />
          <button type="button" onClick={adicionar} disabled={!entrada.trim()} className={`${BTN_SECUNDARIO} shrink-0`}>
            <Plus size={15} aria-hidden="true" /> Adicionar
          </button>
        </div>
        {erroEntrada ? (
          <p id="ajuda-fanout" role="alert" className="text-xs text-[#FF453A]">
            {erroEntrada}
          </p>
        ) : (
          <p id="ajuda-fanout" className="text-xs text-muted">
            Separe por vírgula ou espaço. Enter adiciona.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xs text-muted uppercase tracking-wide mb-2">Fanouts desta posição</h3>
        {lista.length === 0 ? (
          <p className="rounded-xl border border-dashed border-default px-4 py-6 text-sm text-muted text-center">Nenhum fanout. Adicione acima.</p>
        ) : (
          <ul className="rounded-xl border border-default divide-y divide-default max-h-64 overflow-y-auto">
            {lista.map((codigo) => (
              <li key={codigo} className="flex items-center gap-3 px-3 min-h-11">
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={selecionados.has(codigo)}
                    onChange={() => alternar(codigo)}
                    aria-label={`Selecionar ${codigo} para mover`}
                    className={`h-5 w-5 accent-[#FA4C00] ${FOCO}`}
                  />
                  <span className="font-mono text-sm font-semibold tracking-wide">{codigo}</span>
                </label>
                <button
                  type="button"
                  onClick={() => remover(codigo)}
                  aria-label={`Remover ${codigo}`}
                  className={`h-9 w-9 grid place-items-center rounded-lg text-muted hover:text-[#FF453A] hover:bg-[#FF453A]/10 cursor-pointer ${FOCO}`}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selecionados.size > 0 && (
        <div className="rounded-xl border border-default bg-surface-2 p-3.5 space-y-2.5">
          <label htmlFor="destino-fanout" className="flex items-center gap-2 text-sm font-medium">
            <ArrowRightLeft size={15} aria-hidden="true" />
            Mover {selecionados.size} {selecionados.size === 1 ? "selecionado" : "selecionados"} para
          </label>
          <div className="flex gap-2">
            <select id="destino-fanout" value={destino} onChange={(e) => setDestino(e.target.value)} className={INPUT}>
              <option value="">Escolha a posição…</option>
              {outras.map((p) => (
                <option key={`${p.braco}-${p.lado}`} value={`${p.braco}-${p.lado}`}>
                  {rotuloPosicao(setup, p.braco, p.lado)} ({p.fanouts.length})
                </option>
              ))}
            </select>
            <button type="button" onClick={mover} disabled={!destino || sujo || !!ocupado} className={`${BTN_PRIMARIO} shrink-0`}>
              {ocupado === "mover" && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              Mover
            </button>
          </div>
          {sujo && <p className="text-xs text-muted">Salve as alterações antes de mover: o balanceamento usa a lista já salva.</p>}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button type="button" onClick={fechar} disabled={!!ocupado} className={BTN_SECUNDARIO}>
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={!sujo || !!ocupado} className={BTN_PRIMARIO}>
          {ocupado === "salvar" && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          Salvar fanouts
        </button>
      </div>
    </Modal>
  );
}
