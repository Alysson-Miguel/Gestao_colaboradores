export default function SetorDistribuicaoSection({
  title = "Presença por Setor",
  items = [], // [{ label, value }]
  emptyMessage = null,
}) {
  if (!items || items.length === 0) {
    return emptyMessage ? (
      <div className="text-sm text-[#BFBFC3]">
        {emptyMessage}
      </div>
    ) : null;
  }

  const max = Math.max(...items.map((i) => i.value));
  const total = items.reduce((acc, cur) => acc + cur.value, 0);

  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-xs sm:text-sm font-semibold text-[#BFBFC3] uppercase tracking-wide">
          {title}
        </h2>
      )}

      <div className="
        bg-[#1A1A1C]
        border border-[#2A2A2C]
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
              <div key={item.label} className="space-y-2">
                {/* Header Linha */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ranking */}
                    <span className="
                      text-xs
                      w-6 h-6
                      rounded-full
                      bg-[#2A2A2C]
                      flex items-center justify-center
                      text-[#BFBFC3]
                      shrink-0
                    ">
                      {index + 1}
                    </span>

                    {/* Nome setor */}
                    <span className="text-sm text-[#E5E5E5] truncate">
                      {item.label}
                    </span>
                  </div>

                  {/* Valor + Percentual */}
                  <div className="text-sm flex items-center gap-3">
                    <span className="text-white font-semibold">
                      {item.value}
                    </span>
                    <span className="text-[#BFBFC3]">
                      {percentageTotal}%
                    </span>
                  </div>
                </div>

                {/* Barra */}
                <div className="w-full h-3 bg-[#2A2A2C] rounded-full overflow-hidden">
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
              </div>
            );
          })}
      </div>
    </section>
  );
}