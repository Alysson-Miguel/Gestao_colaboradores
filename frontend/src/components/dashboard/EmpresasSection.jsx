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

  // 🔥 Evita problema de grid dinâmico no Tailwind
  const gridCols =
    columns === 3
      ? "md:grid-cols-3"
      : columns === 4
      ? "md:grid-cols-4"
      : "md:grid-cols-2";

  return (
    <section className="space-y-4">
      {title && (
        <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
          {title}
        </h2>
      )}

      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {items.map((item, i) => {
          const faltas = item.faltas ?? 0;
          const atestados = item.atestados ?? 0;
          const ausencias = item.ausencias ?? faltas + atestados;
          const absenteismo = item.absenteismo ?? 0;

          const absColor =
            absenteismo <= 3.4 ? "#34C759" : "#d6000e";

          return (
            <div
              key={`${item.empresa}-${i}`}
              className="rounded-xl bg-[#1A1A1C] p-5 space-y-3 border border-[#2A2A2C]"
            >
              {/* Empresa */}
              <div className="text-sm text-[#E5E5E5] font-medium">
                {item.empresa}
              </div>

              {/* Total */}
              <div className="text-2xl font-semibold text-white">
                {item.total}
              </div>

              {/* Métricas */}
              <div className="space-y-1 text-xs text-[#BFBFC3]">

                <div className="flex justify-between">
                  <span>Faltas</span>
                  <strong className="text-[#FF453A]">
                    {faltas}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>Atestados</span>
                  <strong className="text-[#FF9F0A]">
                    {atestados}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>Ausências</span>
                  <strong className="text-[#d6000e]">
                    {ausencias}
                  </strong>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#2A2A2C]">
                  <span>Absenteísmo</span>
                  <strong style={{ color: absColor }}>
                    {absenteismo}%
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
