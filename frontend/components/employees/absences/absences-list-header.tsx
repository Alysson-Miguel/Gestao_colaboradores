"use client"

export default function AbsencesListHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
          Ocorrências e ABS
        </h1>
        <p className="text-sm mt-2" style={{ color: "#666666" }}>
          Visualize e gerencie todas as ausências registradas
        </p>
      </div>
      <button
        className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-lg"
        style={{ backgroundColor: "#FF9966" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FA541C"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#FF9966"
        }}
      >
        ➕ Registrar ABS
      </button>
    </div>
  )
}
