"use client"

import type React from "react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

interface AbsencesLayoutProps {
  children: React.ReactNode
}

export default function AbsencesLayout({ children }: AbsencesLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>
}
