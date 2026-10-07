import { Info, Trophy } from "lucide-react";
import { Modal } from "./ui";
import { formatNumero } from "./uiTokens";
import { PescasDoBraco } from "./PescasDoBraco";
import { FanoutsDoBraco } from "./fanout/FanoutsDoBraco";

export function AutoAlocacaoDetalheModal({ esteira, braco, grupo, pescas = [], todasPescas = [], fanouts, editavel = false, onChanged, onClose }) {
  const colaboradores = grupo?.colaboradores || [];
  // Visão ao vivo traz produção/rank em tempo real (lido da planilha); visão
  // histórica (persistida no banco) só tem quem/quando — sem produtividade
  // retroativa, já que a planilha não guarda isso no tempo.
  const temProdutividade = grupo?.producaoHoraAtualTotal !== undefined;

  return (
    <Modal
      kicker={esteira.nome}
      titulo={`Braço ${braco.numero}${braco.lado}`}
      subtitulo={`Automático via Workstation · ${colaboradores.length} ${colaboradores.length === 1 ? "pessoa" : "pessoas"}`}
      onClose={onClose}
      largura="max-w-lg"
    >
      {temProdutividade && (
        <dl className="grid grid-cols-2 rounded-xl border border-default divide-x divide-default">
          <div className="px-4 py-3">
            <dt className="text-xs text-muted">Produção da hora (braço)</dt>
            <dd className="text-xl font-semibold tabular-nums mt-0.5 text-[#22C55E]">{formatNumero(grupo?.producaoHoraAtualTotal)}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-muted">Total do turno (braço)</dt>
            <dd className="text-xl font-semibold tabular-nums mt-0.5">{formatNumero(grupo?.efficiencyTotalSoma)}</dd>
          </div>
        </dl>
      )}

      <div>
        <h3 className="text-xs text-muted uppercase tracking-wide mb-2">
          {temProdutividade ? "Rank de produtividade (hora atual)" : "Quem passou por esse braço"}
        </h3>
        <ol className="rounded-xl border border-default divide-y divide-default">
          {colaboradores.map((c, i) => (
            <li key={`${c.opsId}-${i}`} className="px-3.5 py-3 flex items-center gap-3">
              {temProdutividade && (
                <span
                  aria-label={`Posição ${c.posicaoRank}`}
                  className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold shrink-0 tabular-nums ${
                    c.posicaoRank === 1 ? "bg-[#FA4C00]/15 text-[#FA4C00]" : "bg-surface-2 text-muted"
                  }`}
                >
                  {c.posicaoRank === 1 ? <Trophy size={13} aria-hidden="true" /> : c.posicaoRank}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.colaborador?.nomeCompleto || c.opsId}</p>
                <p className="text-xs text-muted mt-0.5">
                  {c.colaborador?.cargo?.nomeCargo || "—"} · Check-in {c.checkIn || "—"}
                  {c.checkOut ? ` · Check-out ${c.checkOut}` : <> · <span className="text-[#22C55E]">Ativo</span></>}
                </p>
              </div>
              {temProdutividade && (
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">{formatNumero(c.producaoHoraAtual)}</p>
                  <p className="text-xs text-muted tabular-nums">{formatNumero(c.efficiencyTotal)} no turno</p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      <FanoutsDoBraco fanouts={fanouts} braco={braco} />

      <PescasDoBraco esteira={esteira} braco={braco} pescas={pescas} todasPescas={todasPescas} editavel={editavel} onChanged={onChanged} />

      <p className="flex items-start gap-2 text-xs text-muted">
        <Info size={14} className="shrink-0 mt-px" aria-hidden="true" />
        Essa alocação vem do check-in na Workstation e não pode ser encerrada por aqui.
      </p>
    </Modal>
  );
}
