import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/**
 * Chart de distribuição genérico (ex: gênero, status, empresa, etc)
 *
 * data: [{ name: string, value: number }]
 */
export default function DistribuicaoGeneroChart({
  data = [],
  title = "Distribuição",
  colors = ["#FA4C00", "#0A84FF", "#34C759", "#FFD60A"],
  showPercentLabel = true,
}) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  const renderPercentLabel = ({ value, percent }) =>
    showPercentLabel && value
      ? `${value} (${Math.round(percent * 100)}%)`
      : "";

  return (
    <div className="bg-[#1A1A1C] rounded-2xl p-4 sm:p-6 w-full space-y-4">
      {title && (
        <h2 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">
          {title}
        </h2>
      )}

      {/* 🔥 ALTURA RESPONSIVA */}
      <div className="h-60 sm:h-[280px] lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              label={renderPercentLabel}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={colors[i % colors.length]}
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
                color: "#000000",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 LEGENDA CUSTOM RESPONSIVA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {data.map((d, i) => {
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
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-[#BFBFC3] truncate">
                {d.name} — {d.value} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}