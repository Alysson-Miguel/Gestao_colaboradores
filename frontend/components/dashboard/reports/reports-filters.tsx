"use client"

import type React from "react"

interface ReportFilter {
  startDate: string
  endDate: string
  center: string
  shift: string
  reportType: string
}

interface ReportsFiltersProps {
  filters: ReportFilter
  setFilters: (filters: ReportFilter) => void
}

export default function ReportsFilters({ filters, setFilters }: ReportsFiltersProps) {
  const centers = ["Matriz", "Filial SP", "Filial RJ", "Filial MG"]
  const shifts = ["Manhã", "Tarde", "Noite"]
  const reportTypes = [
    { value: "completo", label: "Relatório Completo" },
    { value: "resumido", label: "Resumido" },
    { value: "executivo", label: "Executivo" },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#1A1A1A" }}>
        Filtros
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Período - Data Inicial */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Data Inicial
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: "#1A1A1A",
              } as React.CSSProperties
            }
          />
        </div>

        {/* Data Final */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Data Final
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: "#1A1A1A",
              } as React.CSSProperties
            }
          />
        </div>

        {/* Centro */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Centro
          </label>
          <select
            value={filters.center}
            onChange={(e) => setFilters({ ...filters, center: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: filters.center ? "#1A1A1A" : "#AAAAAA",
              } as React.CSSProperties
            }
          >
            <option value="">Todos</option>
            {centers.map((center) => (
              <option key={center} value={center}>
                {center}
              </option>
            ))}
          </select>
        </div>

        {/* Turno */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Turno
          </label>
          <select
            value={filters.shift}
            onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: filters.shift ? "#1A1A1A" : "#AAAAAA",
              } as React.CSSProperties
            }
          >
            <option value="">Todos</option>
            {shifts.map((shift) => (
              <option key={shift} value={shift}>
                {shift}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Relatório */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Tipo
          </label>
          <select
            value={filters.reportType}
            onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: "#1A1A1A",
              } as React.CSSProperties
            }
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
