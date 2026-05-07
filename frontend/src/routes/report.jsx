import { useLocation, Navigate } from "react-router-dom"
import OperationalReport from "../reports/OperationalReport"
import { buildOperationalReportData } from "../reports/buildOperationalReportData"

export default function ReportRoute() {
  const { state } = useLocation()

  if (!state?.dashboardData) {
    return <Navigate to="/dashboard" replace />
  }

  const report = buildOperationalReportData({
    dados: state.dashboardData,
    turno: state.turno,
    periodo: state.periodo,
    belts: state.belts ?? null,
  })

  return <OperationalReport report={report} />
}
