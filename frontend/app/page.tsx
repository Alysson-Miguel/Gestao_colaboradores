import LoginForm from "@/components/login-form"

export const metadata = {
  title: "SHP – Controle de Funcionários | Login",
  description: "Acesse sua conta do sistema de controle de funcionários",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
      <LoginForm />
    </main>
  )
}
