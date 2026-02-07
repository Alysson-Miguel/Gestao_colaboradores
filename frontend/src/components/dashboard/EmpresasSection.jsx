export default function EmpresasSection({
  title = "Quantidade por Empresa",
  items = [],
  emptyMessage = "Nenhum registro encontrado",
  columns = 2,
}) {
  if (!items || items.length === 0) {
    return (
      <div className="text-[#BFBFC3] text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
          {title}
        </h2>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
        {items.map((item, i) => {
          const absColor =
            item.absenteismo <= 3.4 ? "#34C759" : "#d6000e";

          return (
            <div
              key={`${item.empresa}-${i}`}
              className="rounded-xl bg-[#1A1A1C] p-5 space-y-2"
            >
              {/* Empresa */}
              <div className="text-sm text-[#E5E5E5] font-medium">
                {item.empresa}
              </div>

              {/* Total */}
              <div className="text-xl font-semibold text-white">
                {item.total}
              </div>

              {/* Métricas */}
              <div className="flex justify-between text-xs text-[#BFBFC3]">
                <span>
                  Abs:{" "}
                  <strong style={{ color: absColor }}>
                    {item.absenteismo}%
                  </strong>
                </span>
                <span>
                  Atest.: <strong>{item.atestados}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
