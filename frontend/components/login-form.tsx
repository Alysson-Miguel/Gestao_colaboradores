"use client"

import type React from "react"
import { useState } from "react"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const email = (document.getElementById("email") as HTMLInputElement).value
    const password = (document.getElementById("password") as HTMLInputElement).value

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        throw new Error("Erro no login")
      }

      const data = await res.json()
      console.log("LOGIN OK:", data)

      // Se quiser salvar token:
      // localStorage.setItem("token", data.token)

      // Redirecionamento após login
      window.location.href = "/dashboard"

    } catch (err) {
      console.error(err)
      alert("Usuário ou senha inválidos.")
    }

    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md px-4">
      {/* Card Principal */}
      <div className="rounded-3xl shadow-lg p-8 md:p-10" style={{ backgroundColor: "#FFFFFF" }}>
        {/* Logo e Título */}
        <div className="mb-8 text-center">
          <img
            src="https://cdn.awsli.com.br/800x800/2015/2015798/produto/354645871/shoppe--2--mvj1hgvttt.png"
            alt="SPX Logo"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold" style={{ color: "#333333" }}>
            SPX
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666666" }}>
            Controle de Funcionários
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de E-mail */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: "#333333" }}>
              E-mail
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">✉️</span>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                style={{
                  "--tw-ring-color": "#FF9966",
                  borderColor: "#E8E8E8",
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Campo de Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: "#333333" }}>
              Senha
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                style={{
                  "--tw-ring-color": "#FF9966",
                  borderColor: "#E8E8E8",
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xl"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "👁️‍🗨️" : "🔐"}
              </button>
            </div>
          </div>

          {/* Checkbox e Link de Recuperação */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-white" style={{ accentColor: "#FF9966" }} />
              <span className="text-sm" style={{ color: "#666666" }}>
                Lembrar-me
              </span>
            </label>
            <a href="#" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#FF9966" }}>
              Esqueci minha senha
            </a>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            style={{ backgroundColor: "#FF9966" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FA541C"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FF9966"
            }}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: "#E8E8E8" }}></div>
          <span className="text-xs" style={{ color: "#AAAAAA" }}>
            OU
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#E8E8E8" }}></div>
        </div>

        {/* Link para Cadastro */}
        <p className="text-center text-sm" style={{ color: "#666666" }}>
          Não tem uma conta?{" "}
          <a href="#" className="font-semibold transition-colors hover:opacity-80" style={{ color: "#FF9966" }}>
            Cadastre-se
          </a>
        </p>
      </div>

      {/* Rodapé */}
      <p className="text-center text-xs mt-8" style={{ color: "#AAAAAA" }}>
        © 2025 SPX - Controle de Funcionários. Todos os direitos reservados.
      </p>
    </div>
  )
}
