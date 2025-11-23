"use client"

interface ReportsHeaderProps {
  onGeneratePDF: () => void
}

export default function ReportsHeader({ onGeneratePDF }: ReportsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>
          Relatórios
        </h1>
        <p className="text-sm mt-1" style={{ color: "#666666" }}>
          Análise completa de absenteísmo e ausências
        </p>
      </div>

      <button
        onClick={onGeneratePDF}
        className="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
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
        📄 Gerar PDF
      </button>
    </div>
  )
}
