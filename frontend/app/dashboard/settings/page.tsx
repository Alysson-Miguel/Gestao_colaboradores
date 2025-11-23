import DashboardLayout from "@/components/dashboard/dashboard-layout"
import SettingsLayout from "@/components/dashboard/settings/settings-layout"

export const metadata = {
  title: "Configurações - SPX Controle de Funcionários",
  description: "Gerenciamento de configurações gerais do sistema",
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsLayout />
    </DashboardLayout>
  )
}
