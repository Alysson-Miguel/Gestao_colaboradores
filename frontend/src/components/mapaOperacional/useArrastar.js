import { useCallback, useEffect, useRef, useState } from "react";

const LIMITE_PX = 6; // só vira arrasto depois de mexer isso (evita arrasto acidental e preserva o clique)
const BORDA_ROLAGEM_PX = 56;
const VELOCIDADE_ROLAGEM = 14;

/**
 * Arrastar e soltar por pointer events (mouse, toque e caneta).
 * - O arrasto começa só pela "alça" (`props(item)`); o resto do cartão continua rolando no toque.
 * - Os destinos são elementos com `data-destino="<chave>"`.
 * - Esc cancela. `containerRef` rola sozinho na horizontal quando o cartão chega perto da borda.
 */
export function useArrastar({ onSoltar, containerRef, desabilitado = false }) {
  const [arrastando, setArrastando] = useState(null); // { item, x, y }
  const [destino, setDestino] = useState(null);
  const sessao = useRef(null);
  const soltarRef = useRef(onSoltar);

  useEffect(() => {
    soltarRef.current = onSoltar;
  });

  const encerrar = useCallback(() => {
    const s = sessao.current;
    if (s) {
      window.removeEventListener("pointermove", s.mover);
      window.removeEventListener("pointerup", s.soltar);
      window.removeEventListener("pointercancel", s.cancelar);
      window.removeEventListener("keydown", s.teclar);
      cancelAnimationFrame(s.raf);
      document.body.style.userSelect = s.userSelectAnterior;
    }
    sessao.current = null;
    setArrastando(null);
    setDestino(null);
  }, []);

  useEffect(() => encerrar, [encerrar]);

  const destinoEm = (x, y) => document.elementFromPoint(x, y)?.closest("[data-destino]")?.dataset.destino ?? null;

  const iniciar = useCallback(
    (ev, item) => {
      if (desabilitado || (ev.pointerType === "mouse" && ev.button !== 0)) return;
      encerrar();
      const s = {
        item,
        x0: ev.clientX,
        y0: ev.clientY,
        x: ev.clientX,
        y: ev.clientY,
        ativo: false,
        raf: 0,
        userSelectAnterior: document.body.style.userSelect,
      };

      const rolar = () => {
        const caixa = containerRef?.current;
        if (s.ativo) {
          if (caixa) {
            const r = caixa.getBoundingClientRect();
            const dentro = s.y >= r.top && s.y <= r.bottom;
            if (dentro && s.x < r.left + BORDA_ROLAGEM_PX) caixa.scrollLeft -= VELOCIDADE_ROLAGEM;
            else if (dentro && s.x > r.right - BORDA_ROLAGEM_PX) caixa.scrollLeft += VELOCIDADE_ROLAGEM;
          }
          if (s.y < BORDA_ROLAGEM_PX) window.scrollBy(0, -VELOCIDADE_ROLAGEM);
          else if (s.y > window.innerHeight - BORDA_ROLAGEM_PX) window.scrollBy(0, VELOCIDADE_ROLAGEM);
          setDestino(destinoEm(s.x, s.y));
        }
        s.raf = requestAnimationFrame(rolar);
      };

      s.mover = (e) => {
        s.x = e.clientX;
        s.y = e.clientY;
        if (!s.ativo) {
          if (Math.hypot(s.x - s.x0, s.y - s.y0) < LIMITE_PX) return;
          s.ativo = true;
          document.body.style.userSelect = "none";
          s.raf = requestAnimationFrame(rolar);
        }
        setArrastando({ item, x: s.x, y: s.y });
        setDestino(destinoEm(s.x, s.y));
      };
      s.soltar = (e) => {
        const alvo = s.ativo ? destinoEm(e.clientX, e.clientY) : null;
        encerrar();
        if (alvo !== null) soltarRef.current?.(item, alvo);
      };
      s.cancelar = () => encerrar();
      s.teclar = (e) => {
        if (e.key === "Escape") encerrar();
      };

      sessao.current = s;
      window.addEventListener("pointermove", s.mover);
      window.addEventListener("pointerup", s.soltar);
      window.addEventListener("pointercancel", s.cancelar);
      window.addEventListener("keydown", s.teclar);
    },
    [containerRef, desabilitado, encerrar]
  );

  return { arrastando, destino, iniciar };
}
