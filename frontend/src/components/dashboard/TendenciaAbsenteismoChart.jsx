import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Area,
} from "recharts";

export default function TendenciaAbsenteismoChart({
  title,
  data = [],
}) {
  const CustomLabel = ({ x, y, value }) => {
    if (value == null) return null;

    const num = Number(value);
    if (Number.isNaN(num)) return null;

    return (
      <text
        x={x}
        y={Math.max(y - 10, 12)}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={11}
        fontWeight={600}
      >
        {num.toFixed(2)}%
      </text>
    );
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

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 30, right: 20, left: 0, bottom: 10 }}
          >
            <defs>
              <linearGradient
                id="absGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#FA4C00" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FA4C00" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#2A2A2C"
              strokeDasharray="2 4"
              vertical={false}
            />

            <XAxis
              dataKey="data"
              stroke="#8E8E93"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="#8E8E93"
              tick={{ fontSize: 12 }}
              domain={[0, "auto"]}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#121214",
                border: "1px solid #2A2A2C",
                borderRadius: 10,
              }}
              labelStyle={{ color: "#FFFFFF" }}
              formatter={(v) => [`${v}%`, "Absenteísmo"]}
            />

            {/* Área suave */}
            <Area
              type="monotone"
              dataKey="percentual"
              stroke="none"
              fill="url(#absGradient)"
              isAnimationActive={false}
            />

            {/* Linha principal */}
            <Line
              type="monotone"
              dataKey="percentual"
              stroke="#FA4C00"
              strokeWidth={3}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "#1A1A1C",
              }}
              activeDot={{
                r: 6,
                fill: "#FA4C00",
                stroke: "#1A1A1C",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            >
              <LabelList content={CustomLabel} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}