"use client"

export default function Charts() {
  const lineData = [
    { month: "Jan", absences: 2.8 },
    { month: "Fev", absences: 3.1 },
    { month: "Mar", absences: 2.9 },
    { month: "Abr", absences: 3.5 },
    { month: "Mai", absences: 3.2 },
    { month: "Jun", absences: 3.0 },
  ]

  const pieData = [
    { name: "Doença", value: 45 },
    { name: "Falta", value: 25 },
    { name: "Atraso", value: 20 },
    { name: "Outro", value: 10 },
  ]

  const maxAbsence = Math.max(...lineData.map((d) => d.absences))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart Alternative - Simulated */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
          Evolução de Absenteísmo nos últimos 6 meses
        </h3>
        <div className="space-y-4">
          {lineData.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.absences / maxAbsence) * 100}%`,
                    backgroundColor: "#FF9966",
                  }}
                />
              </div>
              <div className="w-12 text-right text-sm font-semibold" style={{ color: "#FF9966" }}>
                {item.absences}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pie Chart Alternative - Simulated */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
          Distribuição de Motivos de Ausência
        </h3>
        <div className="space-y-4">
          {pieData.map((item, index) => {
            const colors = ["#FF9966", "#FFB366", "#FFC699", "#FFD9B3"]
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[index] }} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-700">{item.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 mt-1 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: colors[index],
                      }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-semibold text-gray-700">{item.value}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
