"use client"
import DashboardLayout from "../dashboard/dashboard-layout"
import EmployeeFormHeader from "./employee-form-header"
import EmployeeForm from "./employee-form"

export default function EmployeeFormLayout() {
  return (
    <DashboardLayout>
      <EmployeeFormHeader />
      <main className="px-6 md:px-8 py-8">
        <EmployeeForm />
      </main>
    </DashboardLayout>
  )
}
