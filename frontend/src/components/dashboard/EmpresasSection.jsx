export default function EmpresasSection({
  title = "Quantidade por Empresa",
  items = [],
  emptyMessage = "Nenhum registro encontrado",
}) {
  if (!items || items.length === 0) {
    return (
      <div className="text-[#BFBFC3] text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-xs sm:text-sm font-semibold text-[#BFBFC3] uppercase tracking-wide">
          {title}
        </h2>
      )}

      {/* 🔥 GRID RESPONSIVO BALANCEADO */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          2xl:grid-cols-3
          gap-6
        "
      >
        {items.map((item, i) => {
          const faltas = item.faltas ?? 0;
          const atestados = item.atestados ?? 0;
          const ausencias = item.ausencias ?? faltas + atestados;
          const absenteismo = Number(item.absenteismo ?? 0);

          const absColor =
            absenteismo <= 3.4
              ? "#34C759"
              : absenteismo <= 6
              ? "#FF9F0A"
              : "#FF453A";

          return (
            <div
              key={`${item.empresa}-${i}`}
              className="
                rounded-2xl
                bg-[#1A1A1C]
                p-5
                space-y-4
                border border-[#2A2A2C]
                transition
                hover:border-[#3A3A3C]
                w-full
                min-h-[200px]
              "
            >
              {/* Empresa */}
              <div className="text-sm sm:text-base text-[#E5E5E5] font-medium truncate">
                {item.empresa}
              </div>

              {/* Total */}
              <div className="text-3xl font-semibold text-white">
                {item.total}
              </div>

              {/* Métricas */}
              <div className="space-y-2 text-sm text-[#BFBFC3]">
                <Metric label="Faltas" value={faltas} color="#FF453A" />
                <Metric label="Atestados" value={atestados} color="#FF9F0A" />
                <Metric label="Ausências" value={ausencias} color="#d6000e" />

                <div className="flex justify-between pt-3 border-t border-[#2A2A2C]">
                  <span>Absenteísmo</span>
                  <strong style={{ color: absColor }}>
                    {absenteismo.toFixed(2)}%
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

const Metric = ({ label, value, color }) => (
  <div className="flex justify-between min-w-0">
    <span className="truncate">{label}</span>
    <strong style={{ color }}>{value}</strong>
  </div>
);