import { useEffect, useRef } from "react";

/**
 * Leitor de mão ("bip", USB ou Bluetooth): ele se comporta como um teclado que digita o
 * código bem rápido e termina com Enter. Esse gancho reconhece essa sequência em qualquer
 * lugar da página, sem o operador precisar clicar num campo antes.
 *
 * - Digitação humana é mais lenta: uma pausa maior que o limite reinicia a captura.
 * - Dentro de campos de texto o gancho não interfere (o campo trata o próprio Enter).
 * - O Enter final do leitor é bloqueado e o foco é solto: senão ele "clicaria" no botão
 *   que estiver focado (ex.: Confirmar) sem ninguém ter conferido nada.
 */
const INTERVALO_MAXIMO_MS = 100;
const TAMANHO_MINIMO = 10;
const TAGS_DE_CAMPO = ["INPUT", "TEXTAREA", "SELECT"];

export function useLeitorDeMao({ ativo, onCodigo }) {
  const onCodigoRef = useRef(onCodigo);

  useEffect(() => {
    onCodigoRef.current = onCodigo;
  });

  useEffect(() => {
    if (!ativo) return undefined;

    let buffer = "";
    let ultimaTecla = 0;

    const aoTeclar = (evento) => {
      if (evento.ctrlKey || evento.altKey || evento.metaKey) return;

      const alvo = evento.target;
      const emCampoDeTexto = alvo instanceof HTMLElement && (TAGS_DE_CAMPO.includes(alvo.tagName) || alvo.isContentEditable);
      if (emCampoDeTexto) return;

      const agora = performance.now();

      if (evento.key === "Enter") {
        const codigo = buffer;
        buffer = "";
        if (codigo.length >= TAMANHO_MINIMO && agora - ultimaTecla < INTERVALO_MAXIMO_MS * 2) {
          evento.preventDefault();
          evento.stopPropagation();
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          onCodigoRef.current?.(codigo);
        }
        return;
      }

      if (evento.key.length !== 1) return;
      if (agora - ultimaTecla > INTERVALO_MAXIMO_MS) buffer = "";
      buffer += evento.key;
      ultimaTecla = agora;
    };

    // fase de captura: roda antes de qualquer botão tratar a tecla
    window.addEventListener("keydown", aoTeclar, true);
    return () => window.removeEventListener("keydown", aoTeclar, true);
  }, [ativo]);
}
