"use client"

import { useState } from "react"
import ReportsHeader from "./reports-header"
import ReportsFilters from "./reports-filters"
import ReportsCharts from "./reports-charts"
import ReportsSummaryTable from "./reports-summary-table"

interface ReportFilter {
  startDate: string
  endDate: string
  center: string
  shift: string
  reportType: string
}

export default function ReportsLayout() {
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: "",
    endDate: "",
    center: "",
    shift: "",
    reportType: "completo",
  })

  const handleGeneratePDF = () => {
    alert("Gerando PDF com os filtros selecionados...")
  }

  return (
    <div className="space-y-6">
      <ReportsHeader onGeneratePDF={handleGeneratePDF} />
      <ReportsFilters filters={filters} setFilters={setFilters} />
      <ReportsCharts />
      <ReportsSummaryTable />
    </div>
  )
}
