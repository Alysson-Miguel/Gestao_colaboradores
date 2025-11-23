"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import AbsencesListHeader from "@/components/employees/absences/absences-list-header"
import AbsencesListFilters from "@/components/employees/absences/absences-list-filters"
import AbsencesListTable from "@/components/employees/absences/absences-list-table"

export default function AbsencesListPage() {
  const [filters, setFilters] = useState({
    search: "",
    employee: "",
    center: "",
    shift: "",
    reason: "",
    date: "",
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AbsencesListHeader />
        <AbsencesListFilters filters={filters} setFilters={setFilters} />
        <AbsencesListTable filters={filters} />
      </div>
    </DashboardLayout>
  )
}
