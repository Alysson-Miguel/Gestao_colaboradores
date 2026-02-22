import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#FA4C00", "#0A84FF"];

export default function DistribuicaoColaboradoresCadastradosChart({
  title = "Colaboradores Ativos",
  data = [],
}) {
  const dataAtivos = data.filter(
    (d) => d.status === "ATIVO" || d.status === undefined
  );

  const totalAtivos = dataAtivos.reduce((s, d) => s + d.value, 0);

  const renderLabel = ({ value, percent }) => {
    if (!value || !percent) return "";
    return `${value} (${Math.round(percent * 100)}%)`;
  };

  return (
    <div className="bg-[#1A1A1C] rounded-2xl p-4 sm:p-6 space-y-4 w-full">
      <h3 className="text-xs sm:text-sm font-semibold text-[#BFBFC3] uppercase tracking-wide">
        {title}
      </h3>

      {/* 🔥 ALTURA RESPONSIVA */}
      <div className="h-60 sm:h-[280px] lg:h-80 relative">
        {/* TOTAL CENTRAL */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            {totalAtivos}
          </span>
          <span className="text-[10px] sm:text-xs text-[#BFBFC3] tracking-wide">
            ATIVOS
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataAtivos}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              label={renderLabel}
              labelLine={false}
            >
              {dataAtivos.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(v, _, props) => {
                const pct = totalAtivos
                  ? Math.round((v / totalAtivos) * 100)
                  : 0;
                return [`${v} (${pct}%)`, props.payload.name];
              }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #2A2A2C",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#BFBFC3" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 LEGENDA RESPONSIVA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {dataAtivos.map((d, i) => {
          const pct = totalAtivos
            ? Math.round((d.value / totalAtivos) * 100)
            : 0;

          return (
            <div key={d.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[#BFBFC3] truncate">
                {d.name} — {d.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}