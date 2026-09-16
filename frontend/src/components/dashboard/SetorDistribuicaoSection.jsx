import { useState } from "react";
import { X, Users } from "lucide-react";

export default function SetorDistribuicaoSection({
  title = "Presença por Setor",
  items = [], // [{ label, value, colaboradores?: [{ nome, opsId, escala }] }]
  emptyMessage = null,
}) {
  const [setorSelecionado, setSetorSelecionado] = useState(null);

  if (!items || items.length === 0) {
    return emptyMessage ? (
      <div className="text-sm text-muted">
        {emptyMessage}
      </div>
    ) : null;
  }

  const max = Math.max(...items.map((i) => i.value));
  const total = items.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-xs sm:text-sm font-semibold text-muted uppercase tracking-wide">
          {title}
        </h2>
      )}

      <div className="
        bg-surface
        border border-default
        rounded-2xl
        p-6
        space-y-5
      ">
        {items
          .sort((a, b) => b.value - a.value)
          .map((item, index) => {
            const percentageMax =
              max > 0 ? (item.value / max) * 100 : 0;

            const percentageTotal =
              total > 0
                ? ((item.value / total) * 100).toFixed(1)
                : 0;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setSetorSelecionado(item)}
                className="w-full text-left space-y-2 cursor-pointer rounded-lg -mx-2 px-2 py-1 transition-colors hover:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-[#FA4C00]"
              >
                {/* Header Linha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ranking */}
                    <span className="
                      text-xs
                      w-6 h-6
                      rounded-full
                      bg-surface-2
                      flex items-center justify-center
                      text-muted
                      shrink-0
                    ">
                      {index + 1}
                    </span>

                    {/* Nome setor */}
                    <span className="text-sm text-page truncate">
                      {item.label}
                    </span>
                  </div>

                  {/* Valor + Percentual */}
                  <div className="text-sm flex items-center gap-3">
                    <span className="text-page font-semibold tabular-nums">
                      {item.value}
                    </span>
                    <span className="text-muted tabular-nums">
                      {percentageTotal}%
                    </span>
                  </div>
                </div>

                {/* Barra */}
                <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="
                      h-full
                      rounded-full
                      transition-all
                      duration-700
                    "
                    style={{
                      width: `${percentageMax}%`,
                      background:
                        "linear-gradient(90deg, #FA4C00 0%, #FF7A00 100%)",
                    }}
                  />
                </div>
              </button>
            );
          })}
      </div>

      {/* Modal: colaboradores do setor selecionado */}
      {setorSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSetorSelecionado(null)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[80vh] bg-surface border border-default rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#FA4C00]/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#FA4C00]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-page truncate">{setorSelecionado.label}</h3>
                  <p className="text-xs text-muted">
                    {setorSelecionado.colaboradores?.length || 0} colaborador(es) presente(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSetorSelecionado(null)}
                aria-label="Fechar"
                className="p-1.5 -m-1.5 rounded-lg text-muted hover:text-page hover:bg-surface-2 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FA4C00] shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto -mx-2 px-2">
              {!setorSelecionado.colaboradores?.length ? (
                <p className="text-sm text-muted py-4 text-center">Nenhum colaborador encontrado.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-muted uppercase border-b border-default">
                      <th className="py-2 pr-2 font-medium">Nome</th>
                      <th className="py-2 pr-2 font-medium">Ops ID</th>
                      <th className="py-2 pr-2 font-medium">Escala</th>
                    </tr>
                  </thead>
                  <tbody>
                    {setorSelecionado.colaboradores.map((c) => (
                      <tr key={c.opsId} className="border-b border-default/50 last:border-0">
                        <td className="py-2 pr-2 text-page">{c.nome}</td>
                        <td className="py-2 pr-2 text-muted tabular-nums">{c.opsId}</td>
                        <td className="py-2 pr-2 text-muted">{c.escala || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
