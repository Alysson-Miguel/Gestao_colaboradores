"use client"

const kpiData = [
  {
    title: "Total de Funcionários",
    value: "245",
    emoji: "👥",
    color: "#FF9966",
  },
  {
    title: "Presentes Hoje",
    value: "238",
    emoji: "✅",
    color: "#90EE90",
  },
  {
    title: "Ausências no Dia",
    value: "7",
    emoji: "❌",
    color: "#FFB6C1",
  },
  {
    title: "Absenteísmo Mês",
    value: "3.2%",
    emoji: "📉",
    color: "#FF9966",
  },
]

export default function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi) => (
        <div
          key={kpi.title}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#666666" }}>
                {kpi.title}
              </p>
              <p className="text-3xl font-bold mt-2" style={{ color: "#1A1A1A" }}>
                {kpi.value}
              </p>
            </div>
            <div className="p-3 rounded-lg text-2xl" style={{ backgroundColor: kpi.color + "20" }}>
              {kpi.emoji}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
