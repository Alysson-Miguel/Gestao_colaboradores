"use client"

export default function EmployeeFormHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 md:px-8 py-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
          Novo Funcionário
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          Preencha os dados do funcionário para cadastrá-lo no sistema
        </p>
      </div>
    </header>
  )
}
