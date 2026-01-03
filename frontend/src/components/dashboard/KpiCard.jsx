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
    <div className="flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: bgColor, color }}
        title={tooltip}
      >
        {Icon && <Icon size={20} />}
      </div>

      <div>
        <p className="text-sm text-[#BFBFC3]">
          {label}
        </p>

        <p
          className="text-2xl font-semibold"
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
