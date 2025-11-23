"use client"

import type React from "react"

interface EmployeeFilter {
  search: string
  center: string
  shift: string
  status: string
}

interface EmployeesFiltersProps {
  filters: EmployeeFilter
  setFilters: (filters: EmployeeFilter) => void
}

export default function EmployeesFilters({ filters, setFilters }: EmployeesFiltersProps) {
  const centers = ["Matriz", "Filial SP", "Filial RJ", "Filial MG"]
  const shifts = ["Manhã", "Tarde", "Noite"]
  const statuses = ["Ativo", "Inativo"]

  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value })
  }

  const handleCenterChange = (value: string) => {
    setFilters({ ...filters, center: value })
  }

  const handleShiftChange = (value: string) => {
    setFilters({ ...filters, shift: value })
  }

  const handleStatusChange = (value: string) => {
    setFilters({ ...filters, status: value })
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nome ou CPF..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "#666666" }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                "--tw-ring-color": "#FF9966",
                borderColor: "#E8E8E8",
                color: filters.status ? "#1A1A1A" : "#AAAAAA",
              } as React.CSSProperties
            }
          >
            <option value="">Todos</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
