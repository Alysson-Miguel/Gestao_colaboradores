"use client"
import AbsencesLayout from "@/components/employees/absences/absences-layout"
import AbsencesHeader from "@/components/employees/absences/absences-header"
import AbsencesForm from "@/components/employees/absences/absences-form"

export default function AbsencesPage() {
  return (
    <AbsencesLayout>
      <div className="flex-1">
        <AbsencesHeader />
        <AbsencesForm />
      </div>
    </AbsencesLayout>
  )
}
