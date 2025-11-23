"use client"

export default function OccurrencesTable() {
  const occurrences = [
    {
      id: 1,
      employee: "João Silva",
      type: "Falta",
      date: "2024-01-15",
      status: "Pendente",
    },
    {
      id: 2,
      employee: "Maria Santos",
      type: "Atraso",
      date: "2024-01-14",
      status: "Resolvido",
    },
    {
      id: 3,
      employee: "Pedro Costa",
      type: "Doença",
      date: "2024-01-13",
      status: "Pendente",
    },
    {
      id: 4,
      employee: "Ana Oliveira",
      type: "Falta",
      date: "2024-01-12",
      status: "Resolvido",
    },
    {
      id: 5,
      employee: "Carlos Mendes",
      type: "Atraso",
      date: "2024-01-11",
      status: "Pendente",
    },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-6" style={{ color: "#1A1A1A" }}>
        Últimas Ocorrências Registradas
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottomColor: "#E0E0E0", borderBottomWidth: "1px" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Funcionário
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Data
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {occurrences.map((occurrence) => (
              <tr key={occurrence.id} style={{ borderBottomColor: "#F0F0F0", borderBottomWidth: "1px" }}>
                <td className="px-4 py-4 text-sm" style={{ color: "#1A1A1A" }}>
                  {occurrence.employee}
                </td>
                <td className="px-4 py-4 text-sm" style={{ color: "#666666" }}>
                  {occurrence.type}
                </td>
                <td className="px-4 py-4 text-sm" style={{ color: "#666666" }}>
                  {new Date(occurrence.date).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-4 text-sm">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: occurrence.status === "Resolvido" ? "#90EE9030" : "#FFB6C130",
                      color: occurrence.status === "Resolvido" ? "#228B22" : "#C41E3A",
                    }}
                  >
                    {occurrence.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
