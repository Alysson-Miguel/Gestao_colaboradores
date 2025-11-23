"use client"

interface Absence {
  id: number
  employee: string
  reason: string
  startDate: string
  endDate: string
  days: number
  observation: string
  center: string
  shift: string
}

interface AbsencesListTableProps {
  filters: {
    search: string
    employee: string
    center: string
    shift: string
    reason: string
    date: string
  }
}

const absencesData: Absence[] = [
  {
    id: 1,
    employee: "João Silva",
    reason: "Doença",
    startDate: "2024-11-15",
    endDate: "2024-11-17",
    days: 3,
    observation: "Atestado médico anexado",
    center: "Matriz",
    shift: "Manhã",
  },
  {
    id: 2,
    employee: "Maria Santos",
    reason: "Férias",
    startDate: "2024-11-18",
    endDate: "2024-11-30",
    days: 13,
    observation: "Férias agendadas",
    center: "Filial SP",
    shift: "Tarde",
  },
  {
    id: 3,
    employee: "Pedro Costa",
    reason: "Falta",
    startDate: "2024-11-20",
    endDate: "2024-11-20",
    days: 1,
    observation: "Falta não justificada",
    center: "Matriz",
    shift: "Noite",
  },
  {
    id: 4,
    employee: "Ana Oliveira",
    reason: "Licença",
    startDate: "2024-11-12",
    endDate: "2024-11-14",
    days: 3,
    observation: "Licença médica",
    center: "Filial RJ",
    shift: "Manhã",
  },
  {
    id: 5,
    employee: "Carlos Mendes",
    reason: "Atraso",
    startDate: "2024-11-19",
    endDate: "2024-11-19",
    days: 0,
    observation: "Atraso de 2 horas",
    center: "Filial MG",
    shift: "Tarde",
  },
  {
    id: 6,
    employee: "Beatriz Ferreira",
    reason: "Doença",
    startDate: "2024-11-16",
    endDate: "2024-11-16",
    days: 1,
    observation: "Atestado de uma hora",
    center: "Matriz",
    shift: "Manhã",
  },
]

export default function AbsencesListTable({ filters }: AbsencesListTableProps) {
  const filteredAbsences = absencesData.filter((absence) => {
    const matchSearch = filters.search === "" || absence.employee.toLowerCase().includes(filters.search.toLowerCase())

    const matchEmployee =
      filters.employee === "" || absence.employee.toLowerCase().includes(filters.employee.toLowerCase())

    const matchCenter = filters.center === "" || absence.center === filters.center
    const matchShift = filters.shift === "" || absence.shift === filters.shift
    const matchReason = filters.reason === "" || absence.reason === filters.reason
    const matchDate = filters.date === "" || absence.startDate === filters.date

    return matchSearch && matchEmployee && matchCenter && matchShift && matchReason && matchDate
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F9F9F9", borderBottomColor: "#E0E0E0", borderBottomWidth: "1px" }}>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Funcionário
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Motivo
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Data Inicial
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Data Final
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: "#666666" }}>
                Dias
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Observação
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAbsences.map((absence, index) => (
              <tr
                key={absence.id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                  borderBottomColor: "#F0F0F0",
                  borderBottomWidth: "1px",
                }}
              >
                <td className="px-6 py-4 text-sm" style={{ color: "#1A1A1A" }}>
                  <span className="font-medium">{absence.employee}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        absence.reason === "Doença"
                          ? "#FFE4E1"
                          : absence.reason === "Férias"
                            ? "#E0F5FF"
                            : absence.reason === "Falta"
                              ? "#FFE8E8"
                              : absence.reason === "Licença"
                                ? "#F0E8FF"
                                : "#FFF8E8",
                      color:
                        absence.reason === "Doença"
                          ? "#C41E3A"
                          : absence.reason === "Férias"
                            ? "#0066CC"
                            : absence.reason === "Falta"
                              ? "#D9534F"
                              : absence.reason === "Licença"
                                ? "#7B3FF2"
                                : "#F0AD4E",
                    }}
                  >
                    {absence.reason}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {formatDate(absence.startDate)}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {formatDate(absence.endDate)}
                </td>
                <td className="px-6 py-4 text-sm text-center" style={{ color: "#1A1A1A" }}>
                  <span className="font-semibold">{absence.days}</span>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {absence.observation}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 rounded text-xs font-medium transition-all"
                      style={{
                        backgroundColor: "#FF9966",
                        color: "white",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FA541C"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FF9966"
                      }}
                    >
                      👁️ Ver
                    </button>
                    <button
                      className="px-3 py-1 rounded text-xs font-medium transition-all"
                      style={{
                        backgroundColor: "#FFE8E8",
                        color: "#FF9966",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FF9966"
                        e.currentTarget.style.color = "white"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFE8E8"
                        e.currentTarget.style.color = "#FF9966"
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="px-3 py-1 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: "#FFB6C130",
                        color: "#C41E3A",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFB6C160"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFB6C130"
                      }}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAbsences.length === 0 && (
        <div className="p-12 text-center">
          <p style={{ color: "#AAAAAA" }}>Nenhuma ausência encontrada com os filtros aplicados.</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs" style={{ color: "#666666" }}>
        Total de ausências: <span className="font-semibold">{filteredAbsences.length}</span>
      </div>
    </div>
  )
}
