import { Network } from "lucide-react";
import { FanoutChips } from "./FanoutChips";

/** Bloco "Fanouts do braço" mostrado nos modais do braço (somente leitura). */
export function FanoutsDoBraco({ fanouts, braco }) {
  if (!fanouts) return null;
  return (
    <section aria-label={`Fanouts do braço ${braco.numero}${braco.lado}`} className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-xs text-muted uppercase tracking-wide">
        <Network size={13} aria-hidden="true" />
        Fanouts deste braço
        <span className="tabular-nums normal-case">{fanouts.length}</span>
      </h3>
      {fanouts.length === 0 ? (
        <p className="text-sm text-muted">Nenhum fanout configurado para este braço.</p>
      ) : (
        <FanoutChips fanouts={fanouts} rotulo={`Fanouts do braço ${braco.numero}${braco.lado}`} />
      )}
    </section>
  );
}
