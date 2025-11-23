"use client"

import { useState } from "react"

const settingsConfig = [
  {
    id: "company",
    title: "Dados da Empresa",
    description: "Informações e detalhes da empresa",
    emoji: "🏢",
    color: "#FF9966",
  },
  {
    id: "centers",
    title: "Centros de Trabalho",
    description: "Gerencie os centros e filiais",
    emoji: "📍",
    color: "#FA541C",
  },
  {
    id: "shifts",
    title: "Turnos",
    description: "Configure horários e turnos de trabalho",
    emoji: "⏰",
    color: "#FF9966",
  },
  {
    id: "positions",
    title: "Cargos",
    description: "Gerencie cargos e funções",
    emoji: "👔",
    color: "#FA541C",
  },
  {
    id: "users",
    title: "Usuários do Sistema",
    description: "Controle de acesso e permissões",
    emoji: "🔐",
    color: "#FF9966",
  },
]

export default function SettingsCards() {
  const [activeCard, setActiveCard] = useState<string | null>(null)

  const handleManage = (cardId: string) => {
    setActiveCard(cardId)
    alert(`Abrindo configurações de ${settingsConfig.find((c) => c.id === cardId)?.title}...`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {settingsConfig.map((config) => (
        <div
          key={config.id}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
        >
          {/* Card Header com Ícone */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1" style={{ color: "#1A1A1A" }}>
                {config.title}
              </h3>
              <p className="text-sm" style={{ color: "#999999" }}>
                {config.description}
              </p>
            </div>
          </div>

          {/* Ícone Grande */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
            style={{ backgroundColor: config.color + "15" }}
          >
            {config.emoji}
          </div>

          {/* Botão Gerenciar */}
          <button
            onClick={() => handleManage(config.id)}
            className="w-full py-3 px-4 rounded-2xl font-semibold transition-all duration-300 text-white"
            style={{ backgroundColor: config.color }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1"
            }}
          >
            Gerenciar
          </button>

          {/* Indicador Ativo */}
          {activeCard === config.id && (
            <div
              className="mt-4 p-3 rounded-lg text-sm text-center font-medium"
              style={{ backgroundColor: config.color + "20", color: config.color }}
            >
              ✓ Aberto para edição
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
