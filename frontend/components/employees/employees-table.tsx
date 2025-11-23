"use client"

interface Employee {
  id: number
  name: string
  cpf: string
  center: string
  shift: string
  position: string
  status: "Ativo" | "Inativo"
}

interface EmployeesTableProps {
  filters: {
    search: string
    center: string
    shift: string
    status: string
  }
}

const employeesData: Employee[] = [
  {
    id: 1,
    name: "João Silva",
    cpf: "123.456.789-10",
    center: "Matriz",
    shift: "Manhã",
    position: "Gerente de Vendas",
    status: "Ativo",
  },
  {
    id: 2,
    name: "Maria Santos",
    cpf: "234.567.890-11",
    center: "Filial SP",
    shift: "Tarde",
    position: "Analista de Sistemas",
    status: "Ativo",
  },
  {
    id: 3,
    name: "Pedro Costa",
    cpf: "345.678.901-12",
    center: "Matriz",
    shift: "Noite",
    position: "Operador de Máquina",
    status: "Inativo",
  },
  {
    id: 4,
    name: "Ana Oliveira",
    cpf: "456.789.012-13",
    center: "Filial RJ",
    shift: "Manhã",
    position: "Supervisora",
    status: "Ativo",
  },
  {
    id: 5,
    name: "Carlos Mendes",
    cpf: "567.890.123-14",
    center: "Filial MG",
    shift: "Tarde",
    position: "Técnico de Manutenção",
    status: "Ativo",
  },
  {
    id: 6,
    name: "Beatriz Ferreira",
    cpf: "678.901.234-15",
    center: "Matriz",
    shift: "Manhã",
    position: "Coordenadora RH",
    status: "Ativo",
  },
  {
    id: 7,
    name: "Diego Alves",
    cpf: "789.012.345-16",
    center: "Filial SP",
    shift: "Noite",
    position: "Segurança",
    status: "Ativo",
  },
  {
    id: 8,
    name: "Fernanda Rocha",
    cpf: "890.123.456-17",
    center: "Filial RJ",
    shift: "Tarde",
    position: "Gerente de Projetos",
    status: "Inativo",
  },
]

export default function EmployeesTable({ filters }: EmployeesTableProps) {
  const filteredEmployees = employeesData.filter((employee) => {
    const matchSearch =
      filters.search === "" ||
      employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.cpf.includes(filters.search)

    const matchCenter = filters.center === "" || employee.center === filters.center
    const matchShift = filters.shift === "" || employee.shift === filters.shift
    const matchStatus = filters.status === "" || employee.status === filters.status

    return matchSearch && matchCenter && matchShift && matchStatus
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F9F9F9", borderBottomColor: "#E0E0E0", borderBottomWidth: "1px" }}>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Nome
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                CPF
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Centro
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Turno
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Cargo
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: "#666666" }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr
                key={employee.id}
                style={{
                  backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                  borderBottomColor: "#F0F0F0",
                  borderBottomWidth: "1px",
                }}
              >
                <td className="px-6 py-4 text-sm" style={{ color: "#1A1A1A" }}>
                  <span className="font-medium">{employee.name}</span>
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {employee.cpf}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {employee.center}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {employee.shift}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: "#666666" }}>
                  {employee.position}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: employee.status === "Ativo" ? "#90EE9030" : "#FFB6C130",
                      color: employee.status === "Ativo" ? "#228B22" : "#C41E3A",
                    }}
                  >
                    {employee.status}
                  </span>
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
                      ✏️ Editar
                    </button>
                    <button
                      className="px-3 py-1 rounded text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: "#E8E8E8",
                        color: "#666666",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#D0D0D0"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#E8E8E8"
                      }}
                    >
                      👁️ Ver
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
                      🚫 Inativar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="p-12 text-center">
          <p style={{ color: "#AAAAAA" }}>Nenhum funcionário encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Rodapé com informações */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs" style={{ color: "#666666" }}>
        Total de funcionários: <span className="font-semibold">{filteredEmployees.length}</span>
      </div>
    </div>
  )
}
