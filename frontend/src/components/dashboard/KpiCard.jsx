export default function KpiCard({
  icon: Icon,
  label,
  value,
  color = "#FFFFFF",
  bgColor = "#2A2A2C",
  suffix,
  tooltip,
}) {
  return (
    <div
      className="
        bg-[#1A1A1C]
        border border-[#2A2A2C]
        rounded-2xl
        p-4
        flex items-center gap-4
        min-h-[90px]
        transition
        hover:border-[#3A3A3C]
      "
    >
      {/* ICON */}
      <div
        className="
          w-11 h-11
          rounded-xl
          flex items-center justify-center
          shrink-0
        "
        style={{ backgroundColor: bgColor, color }}
        title={tooltip}
      >
        {Icon && <Icon size={20} />}
      </div>

      {/* CONTENT */}
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-[#BFBFC3] truncate">
          {label}
        </p>

        <p
          className="text-2xl sm:text-3xl font-semibold leading-tight"
          style={{ color }}
        >
          {value}
          {suffix && (
            <span className="text-base font-medium ml-1">
              {suffix}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}