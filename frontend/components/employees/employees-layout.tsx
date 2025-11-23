"use client"

import { useState } from "react"
import DashboardLayout from "../dashboard/dashboard-layout"
import EmployeesHeader from "./employees-header"
import EmployeesFilters from "./employees-filters"
import EmployeesTable from "./employees-table"

interface EmployeeFilter {
  search: string
  center: string
  shift: string
  status: string
}

export default function EmployeesLayout() {
  const [filters, setFilters] = useState<EmployeeFilter>({
    search: "",
    center: "",
    shift: "",
    status: "",
  })

  return (
    <DashboardLayout>
      {/* Header */}
      <EmployeesHeader />

      {/* Content Area */}
      <main className="flex-1 overflow-auto p-6 md:p-8" style={{ backgroundColor: "#F5F5F5" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Filtros */}
          <EmployeesFilters filters={filters} setFilters={setFilters} />

          {/* Tabela */}
          <EmployeesTable filters={filters} />
        </div>
      </main>
    </DashboardLayout>
  )
}
