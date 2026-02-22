export default function StatusColaboradoresSection({
  title = "Status dos Colaboradores",
  items = [],
  footer = "",
}) {
  if (!items || items.length === 0) return null;

  const total = items.reduce(
    (acc, cur) =>
      acc + (cur.value ?? cur.quantidade ?? 0),
    0
  );

  const getColor = (label) => {
    const l = String(label).toUpperCase();

    if (l.includes("ATIVO") || l.includes("PRESENTE")) return "#34C759";
    if (l.includes("FALTA")) return "#FF453A";
    if (l.includes("ATEST")) return "#FF9F0A";
    if (l.includes("FÉR")) return "#0A84FF";
    if (l.includes("AFAST")) return "#AF52DE";

    return "#FA4C00";
  };

  return (
    <div
      className="
        bg-[#1A1A1C]
        border border-[#2A2A2C]
        rounded-2xl
        p-6
        space-y-6
      "
    >
      {title && (
        <h2 className="text-xs sm:text-sm font-semibold text-[#BFBFC3] uppercase tracking-wide">
          {title}
        </h2>
      )}

      <div className="space-y-6">
        {items.map((item, i) => {
          const label = item.label ?? item.status ?? "-";
          const value = item.value ?? item.quantidade ?? 0;

          const percentage =
            total > 0 ? (value / total) * 100 : 0;

          const color = getColor(label);

          const radius = 22;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset =
            circumference - (percentage / 100) * circumference;

          return (
            <div
              key={`${label}-${i}`}
              className="
                flex items-center justify-between
                bg-[#121214]
                border border-[#2A2A2C]
                rounded-xl
                px-6 py-5
                transition
                hover:border-[#3A3A3C]
              "
            >
              {/* Label */}
              <span className="text-base text-[#E5E5E5]">
                {label}
              </span>

              {/* Valor grande */}
              <span
                className="text-4xl font-semibold"
                style={{ color }}
              >
                {value}
              </span>

              {/* Percentual circular maior */}
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    stroke="#2A2A2C"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    stroke={color}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{
                      transition: "stroke-dashoffset 0.6s ease",
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center text-xs text-[#BFBFC3] font-medium">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {footer && (
        <div className="pt-4 border-t border-[#2A2A2C]">
          <p className="text-sm text-[#BFBFC3]">
            {footer}
          </p>
        </div>
      )}
    </div>
  );
}