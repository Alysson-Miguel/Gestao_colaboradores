export default function KpiCard({ icon, label, value, color = "#FFFFFF" }) {
  const Icon = icon;

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "#2A2A2C", color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-[#BFBFC3]">{label}</p>
        <p className="text-2xl font-semibold" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}
