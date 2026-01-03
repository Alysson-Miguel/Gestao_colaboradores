export default function DashboardHeader({
  title,
  subtitle,
  date,
  badges = [],
}) {
  /* =====================================================
     FORMATADORES
  ===================================================== */

  const formatDateBR = (value) => {
    if (!value) return "-";

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      return `${d}/${m}/${y}`;
    }

    // ISO completo
    const iso = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split("-");
      return `${d}/${m}/${y}`;
    }

    return value;
  };

  const renderPeriodo = () => {
    if (!date) return "-";

    // Caso já venha como string com →
    if (typeof date === "string" && date.includes("→")) {
      const [inicio, fim] = date.split("→").map((v) => v.trim());
      return `${formatDateBR(inicio)} → ${formatDateBR(fim)}`;
    }

    // Caso venha como objeto { inicio, fim }
    if (typeof date === "object" && date.inicio && date.fim) {
      return `${formatDateBR(date.inicio)} → ${formatDateBR(date.fim)}`;
    }

    // Data única
    return formatDateBR(date);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-white">
        {title}
      </h1>

      <div className="flex flex-wrap items-center gap-3 text-sm text-[#BFBFC3]">
        {(subtitle || date) && (
          <span>
            {subtitle}
            {date && `: ${renderPeriodo()}`}
          </span>
        )}

        {badges.map((badge, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-md bg-[#2A2A2C] text-white"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
