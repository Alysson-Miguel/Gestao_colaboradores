"use client"

export default function EmployeesHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-6 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
          Gestão de Funcionários
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          Gerencie todos os funcionários da empresa
        </p>
      </div>

      <button
        className="px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105"
        style={{ backgroundColor: "#FF9966" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FA541C"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#FF9966"
        }}
      >
        + Adicionar Funcionário
      </button>
    </header>
  )
}
