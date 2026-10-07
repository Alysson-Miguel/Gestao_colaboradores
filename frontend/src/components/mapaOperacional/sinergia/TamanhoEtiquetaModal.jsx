import { useState } from "react";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../ui";
import { BTN_PRIMARIO, BTN_SECUNDARIO, FOCO, INPUT } from "../uiTokens";
import { MAX_MM, MIN_MM, MODOS, PRESETS, lerTamanhoEtiqueta, salvarTamanhoEtiqueta, valido } from "../../../utils/etiquetaTamanho";
import { imprimirEtiquetaTeste } from "../../../utils/imprimirEtiquetaSinergia";

const rotulo = (t) => `${t.largura} × ${t.altura} mm`;

export function TamanhoEtiquetaModal({ onClose }) {
  const [inicial] = useState(lerTamanhoEtiqueta);
  const [largura, setLargura] = useState(String(inicial.largura));
  const [altura, setAltura] = useState(String(inicial.altura));
  const [modo, setModo] = useState(inicial.modo);
  const [imprimindo, setImprimindo] = useState(null);

  const tamanho = { largura: Number(largura), altura: Number(altura), modo };
  const ok = valido(tamanho.largura) && valido(tamanho.altura);
  const doPreset = (p) => p.largura === tamanho.largura && p.altura === tamanho.altura;
  const razao = ok ? tamanho.largura / tamanho.altura : 1.67;

  function salvar() {
    if (!ok) return;
    salvarTamanhoEtiqueta(tamanho);
    toast.success(`Etiqueta de ${rotulo(tamanho)} salva neste computador`);
    onClose();
  }

  async function testar(opcao) {
    if (!ok) return;
    setImprimindo(opcao.id);
    try {
      await imprimirEtiquetaTeste({ ...tamanho, modo: opcao.id }, opcao.rotulo);
    } catch {
      toast.error("Não foi possível abrir a impressão");
    } finally {
      setImprimindo(null);
    }
  }

  return (
    <Modal kicker="Sinergia Interna" titulo="Etiqueta: tamanho e orientação" subtitulo="Fica salvo neste computador, onde a impressora está ligada" onClose={onClose} largura="max-w-lg">
      <section aria-labelledby="passo-tamanho" className="space-y-3">
        <h3 id="passo-tamanho" className="text-sm font-semibold">
          1. Tamanho da etiqueta
        </h3>
        <div role="radiogroup" aria-label="Tamanhos comuns" className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={rotulo(p)}
              type="button"
              role="radio"
              aria-checked={doPreset(p)}
              onClick={() => {
                setLargura(String(p.largura));
                setAltura(String(p.altura));
              }}
              className={`h-11 px-3.5 rounded-xl border text-sm font-medium tabular-nums transition-colors cursor-pointer ${FOCO} ${
                doPreset(p) ? "bg-[#FA4C00] border-[#FA4C00] text-white" : "bg-surface-2 border-default hover:bg-surface"
              }`}
            >
              {rotulo(p)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="etiqueta-largura" className="text-xs text-muted">
              Largura (mm)
            </label>
            <input id="etiqueta-largura" type="number" inputMode="decimal" min={MIN_MM} max={MAX_MM} step="1" value={largura} onChange={(e) => setLargura(e.target.value)} className={`${INPUT} tabular-nums`} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="etiqueta-altura" className="text-xs text-muted">
              Altura (mm)
            </label>
            <input id="etiqueta-altura" type="number" inputMode="decimal" min={MIN_MM} max={MAX_MM} step="1" value={altura} onChange={(e) => setAltura(e.target.value)} className={`${INPUT} tabular-nums`} />
          </div>
        </div>
        {!ok && (
          <p role="alert" className="text-xs text-[#FF453A]">
            Informe medidas entre {MIN_MM} e {MAX_MM} mm.
          </p>
        )}

        <div className="rounded-xl bg-surface-2 p-3 grid place-items-center">
          <div
            aria-label={`Proporção da etiqueta: ${ok ? rotulo(tamanho) : "medida inválida"}`}
            className="border-2 border-dashed border-default rounded-md bg-white text-black grid place-items-center text-xs font-semibold tabular-nums max-w-full"
            style={{ aspectRatio: String(razao), width: razao >= 1 ? "min(100%, 200px)" : `${Math.round(120 * razao)}px` }}
          >
            {ok ? rotulo(tamanho) : "—"}
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Meça com uma régua <strong className="text-page font-medium">uma etiqueta</strong> (largura × altura, sem o espaço entre elas). A largura é o lado que passa pela cabeça de impressão.
        </p>
      </section>

      <section aria-labelledby="passo-orientacao" className="space-y-3">
        <div>
          <h3 id="passo-orientacao" className="text-sm font-semibold">
            2. Orientação da impressão (calibrar uma vez)
          </h3>
          <p className="text-xs text-muted leading-relaxed mt-1">
            Cada impressora recebe a página de um jeito. Imprima as opções abaixo (uma etiqueta cada) e marque a que saiu certa: texto na horizontal, QR inteiro e nada cortado. Depois é só imprimir, sem girar nada.
          </p>
        </div>
        <div className="rounded-xl border border-default bg-surface-2 p-3.5 space-y-2">
          <p className="text-sm font-medium">Impressora Elgin L42 Pro: configurar uma vez</p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-muted leading-relaxed">
            <li>
              Windows → Impressoras → ELGIN L42PRO FULL → <strong className="text-page font-medium">Preferências de impressão</strong> → Configuração de página.
            </li>
            <li>
              Em <strong className="text-page font-medium">Papel de etiquetas</strong>, clique em <strong className="text-page font-medium">Novo…</strong> e crie um papel de{" "}
              <strong className="text-page font-medium tabular-nums">{ok ? rotulo(tamanho) : "largura × altura"}</strong> (o tamanho real da etiqueta, não 4 × 6) e selecione-o. Com 4 × 6 a
              impressora avança 152 mm e gasta uma etiqueta em branco a cada impressão.
            </li>
            <li>
              Em <strong className="text-page font-medium">Orientação</strong>, marque <strong className="text-page font-medium">Retrato</strong>. Em Paisagem o texto sai no sentido do avanço.
            </li>
            <li>
              Use a <strong className="text-page font-medium">Opção 5</strong> abaixo. Na janela de impressão do navegador, em Mais definições: papel igual ao criado, layout que mostre a etiqueta
              deitada e com o conteúdo ocupando tudo, escala 100% e margens “Nenhuma”.
            </li>
            <li>Se a etiqueta não parar no lugar certo, calibre o sensor de intervalos da impressora (segure o botão de avanço até ela calibrar).</li>
          </ol>
        </div>
        <div role="radiogroup" aria-label="Orientação da impressão" className="rounded-xl border border-default divide-y divide-default">
          {MODOS.map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
                <input type="radio" name="modo-etiqueta" checked={modo === o.id} onChange={() => setModo(o.id)} className={`mt-1 h-5 w-5 accent-[#FA4C00] ${FOCO}`} />
                <span className="text-sm">
                  {o.rotulo}
                  <span className="block text-xs text-muted">{o.detalhe}</span>
                </span>
              </label>
              <button type="button" onClick={() => testar(o)} disabled={!ok || imprimindo === o.id} className={`${BTN_SECUNDARIO} h-10 shrink-0`}>
                <Printer size={15} aria-hidden="true" /> Imprimir teste
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Na janela de impressão: impressora térmica, papel do mesmo tamanho da etiqueta, margens “Nenhuma” e escala 100%. Cada teste sai com réguas em mm e a marca “TOPO”.
        </p>
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={BTN_SECUNDARIO}>
          Cancelar
        </button>
        <button type="button" onClick={salvar} disabled={!ok} className={BTN_PRIMARIO}>
          Salvar configuração
        </button>
      </div>
    </Modal>
  );
}
