"use client"

import type React from "react"

interface AbsenceFilter {
  search: string
  employee: string
  center: string
  shift: string
  reason: string
  date: string
}

interface AbsencesListFiltersProps {
  filters: AbsenceFilter
  setFilters: (filters: AbsenceFilter) => void
}

export default function AbsencesListFilters({ filters, setFilters }: AbsencesListFiltersProps) {
  const centers = ["Matriz", "Filial SP", "Filial RJ", "Filial MG"]
  const shifts = ["Manhã", "Tarde", "Noite"]
  const reasons = ["Doença", "Falta", "Atraso", "Férias", "Licença", "Otro"]

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value })
  }

  const handleEmployeeChange = (value: string) => {
    setFilters({ ...filters, employee: value })
  }

  const handleCenterChange = (value: string) => {
    setFilters({ ...filters, center: value })
  }

  const handleShiftChange = (value: string) => {
    setFilters({ ...filters, shift: value })
  }

  const handleReasonChange = (value: string) => {
    setFilters({ ...filters, reason: value })
  }

  const handleDateChange = (value: string) => {
    setFilters({ ...filters, date: value })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Funcionário */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Funcionário
          </label>
          <input
            type="text"
            placeholder="Nome do funcionário..."
            value={filters.employee}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
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
            onChange={(e) => handleCenterChange(e.target.value)}
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
            onChange={(e) => handleShiftChange(e.target.value)}
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

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Motivo
          </label>
          <select
            value={filters.reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: filters.reason ? "#1A1A1A" : "#AAAAAA",
              } as React.CSSProperties
            }
          >
            <option value="">Todos</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Data
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
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
      </div>
    </div>
  )
}
