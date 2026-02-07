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

export default function DistribuicaoVinculoChart({ title, data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1A1A1C] rounded-xl p-6 text-[#BFBFC3]">
        Nenhum dado disponível
      </div>
    );
  }

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const percent = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
      <text
        x={x}
        y={y}
        fill="#E5E5E5"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {value} ({percent}%)
      </text>
    );
  };

  return (
    <section className="bg-[#1A1A1C] rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
        {title}
      </h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              labelLine={false}
              label={renderLabel}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name] || "#888"}
                />
              ))}
            </Pie>

            {/* TOTAL NO CENTRO */}
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FFFFFF"
              fontSize={20}
              fontWeight={700}
            >
              {total}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#BFBFC3"
              fontSize={12}
            >
              Total
            </text>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* LEGENDA */}
      <div className="flex justify-center gap-6 text-sm">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[d.name] }}
            />
            <span className="text-[#E5E5E5]">
              {d.name}: <strong></strong>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
