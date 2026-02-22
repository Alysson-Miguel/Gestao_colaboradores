import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = {
  SPX: "#FA4C00",
  BPO: "#3B82F6",
};

export default function DistribuicaoVinculoChart({ title, data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1A1A1C] rounded-2xl p-4 sm:p-6 text-[#BFBFC3]">
        Nenhum dado disponível
      </div>
    );
  }

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  const renderLabel = ({ value, percent }) => {
    if (!value || !percent) return "";
    return `${value} (${Math.round(percent * 100)}%)`;
  };

  return (
    <section className="bg-[#1A1A1C] rounded-2xl p-4 sm:p-6 space-y-4 w-full">
      {title && (
        <h2 className="text-xs sm:text-sm font-semibold text-[#BFBFC3] uppercase tracking-wide">
          {title}
        </h2>
      )}

      {/* 🔥 ALTURA RESPONSIVA */}
      <div className="h-60 sm:h-[280px] lg:h-80 relative">
        {/* TOTAL CENTRAL */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            {total}
          </span>
          <span className="text-[10px] sm:text-xs text-[#BFBFC3] tracking-wide">
            TOTAL
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              label={renderLabel}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name] || "#888"}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => {
                const percent =
                  total > 0
                    ? ((value / total) * 100).toFixed(1)
                    : 0;
                return [`${value} (${percent}%)`, name];
              }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #3D3D40",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 LEGENDA RESPONSIVA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {data.map((d) => {
          const percent =
            total > 0
              ? Math.round((d.value / total) * 100)
              : 0;

          return (
            <div
              key={d.name}
              className="flex items-center gap-2 min-w-0"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[d.name] || "#888" }}
              />
              <span className="text-[#E5E5E5] truncate">
                {d.name} — {d.value} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}