"use client"

export default function ReportsSummaryTable() {
  const summaryData = [
    { center: "Matriz", total: 45, percentage: 2.8, trend: "↑" },
    { center: "Filial SP", total: 32, percentage: 2.1, trend: "↓" },
    { center: "Filial RJ", total: 28, percentage: 1.9, trend: "↓" },
    { center: "Filial MG", total: 18, percentage: 1.2, trend: "→" },
  ]

  const totals = {
    total: summaryData.reduce((acc, item) => acc + item.total, 0),
    average: (summaryData.reduce((acc, item) => acc + item.percentage, 0) / summaryData.length).toFixed(2),
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
        Resumo por Centro
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F9F9F9", borderBottomColor: "#E0E0E0", borderBottomWidth: "1px" }}>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Centro
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "#666666" }}>
                Total ABS
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "#666666" }}>
                % Absenteísmo
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "#666666" }}>
                Tendência
              </th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((item, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                  borderBottomColor: "#F0F0F0",
                  borderBottomWidth: "1px",
                }}
              >
                <td className="px-6 py-4 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                  {item.center}
                </td>
                <td className="px-6 py-4 text-center text-sm" style={{ color: "#666666" }}>
                  <span
                    className="px-3 py-1 rounded-lg font-semibold"
                    style={{
                      backgroundColor: "#FF996630",
                      color: "#FF9966",
                    }}
                  >
                    {item.total}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm" style={{ color: "#666666" }}>
                  <span className="font-semibold" style={{ color: "#FA541C" }}>
                    {item.percentage}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                  <span
                    style={{
                      color: item.trend === "↑" ? "#C41E3A" : item.trend === "↓" ? "#228B22" : "#FFA500",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    {item.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm" style={{ color: "#666666" }}>
            Total de Ausências
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: "#FF9966" }}>
            {totals.total}
          </p>
        </div>
        <div>
          <p className="text-sm" style={{ color: "#666666" }}>
            Absenteísmo Médio
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: "#FA541C" }}>
            {totals.average}%
          </p>
        </div>
      </div>
    </div>
  )
}
