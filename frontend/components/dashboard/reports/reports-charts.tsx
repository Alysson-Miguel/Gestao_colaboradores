"use client"

export default function ReportsCharts() {
  const centerData = [
    { center: "Matriz", abs: 45 },
    { center: "Filial SP", abs: 32 },
    { center: "Filial RJ", abs: 28 },
    { center: "Filial MG", abs: 18 },
  ]

  const reasonData = [
    { name: "Doença", value: 40 },
    { name: "Falta", value: 25 },
    { name: "Férias", value: 20 },
    { name: "Licença", value: 10 },
    { name: "Atraso", value: 5 },
  ]

  const trendData = [
    { month: "Jan", percentage: 2.8 },
    { month: "Fev", percentage: 3.1 },
    { month: "Mar", percentage: 2.9 },
    { month: "Abr", percentage: 3.5 },
    { month: "Mai", percentage: 3.2 },
    { month: "Jun", percentage: 3.0 },
  ]

  const maxAbs = Math.max(...centerData.map((d) => d.abs))
  const maxTrend = Math.max(...trendData.map((d) => d.percentage))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico de Barras - ABS por Centro */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
          ABS por Centro
        </h3>
        <div className="space-y-4">
          {centerData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium" style={{ color: "#666666" }}>
                {item.center}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${(item.abs / maxAbs) * 100}%`,
                    backgroundColor: "#FF9966",
                  }}
                />
              </div>
              <div className="w-12 text-right text-sm font-semibold" style={{ color: "#FF9966" }}>
                {item.abs}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Pizza - Motivos */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
          Motivos Recorrentes
        </h3>
        <div className="space-y-4">
          {reasonData.map((item, index) => {
            const colors = ["#FF9966", "#FFB366", "#FFC699", "#FFD9B3", "#FFEAD9"]
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {item.name}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mt-1 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: colors[index],
                      }}
                    />
                  </div>
                </div>
                <div className="w-10 text-right text-xs font-semibold" style={{ color: "#666666" }}>
                  {item.value}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gráfico de Linha - Tendência Mensal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
          Tendência Mensal
        </h3>
        <div className="space-y-3">
          {trendData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-10 text-sm font-medium text-center" style={{ color: "#666666" }}>
                {item.month}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${(item.percentage / maxTrend) * 100}%`,
                    backgroundColor: "#FA541C",
                  }}
                />
              </div>
              <div className="w-12 text-right text-sm font-semibold" style={{ color: "#FA541C" }}>
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
