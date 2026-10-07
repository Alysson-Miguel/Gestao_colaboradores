/** Códigos de fanout em "pílulas" monoespaçadas. `destaque` marca os que contêm o texto buscado. */
export function FanoutChips({ fanouts, destaque = "", compacto = false, rotulo }) {
  const termo = destaque.trim().toUpperCase();
  return (
    <ul aria-label={rotulo} className="flex flex-wrap gap-1.5">
      {fanouts.map((codigo) => {
        const acertou = termo && codigo.includes(termo);
        const apagado = termo && !acertou;
        return (
          <li
            key={codigo}
            className={`inline-flex items-center rounded-md border font-mono font-semibold tracking-wide tabular-nums ${
              compacto ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs"
            } ${
              acertou
                ? "border-[#FA4C00] bg-[#FA4C00]/15 text-[#FA4C00]"
                : "border-default bg-surface-2 text-page"
            } ${apagado ? "opacity-40" : ""}`}
          >
            {codigo}
          </li>
        );
      })}
    </ul>
  );
}
