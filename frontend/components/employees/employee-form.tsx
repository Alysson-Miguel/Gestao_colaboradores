"use client"

import type React from "react"

import { useState } from "react"

export default function EmployeeForm() {
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    centro: "",
    turno: "",
    cargo: "",
    dataAdmissao: "",
    status: "ativo",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Formulário enviado:", formData)
  }

  const handleCancel = () => {
    window.history.back()
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14)
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 15)
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCPF(e.target.value)
    handleInputChange(e)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhone(e.target.value)
    handleInputChange(e)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl shadow-lg p-8 md:p-10" style={{ backgroundColor: "#FFFFFF" }}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Nome Completo
              </label>
              <input
                id="nome"
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Digite o nome completo"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Telefone
              </label>
              <input
                id="telefone"
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(00) 0000-0000"
                maxLength={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@empresa.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* Centro */}
            <div>
              <label htmlFor="centro" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Centro
              </label>
              <select
                id="centro"
                name="centro"
                value={formData.centro}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              >
                <option value="">Selecione um centro</option>
                <option value="sp">São Paulo</option>
                <option value="rj">Rio de Janeiro</option>
                <option value="mg">Minas Gerais</option>
                <option value="rs">Rio Grande do Sul</option>
                <option value="ba">Bahia</option>
              </select>
            </div>

            {/* Turno */}
            <div>
              <label htmlFor="turno" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Turno
              </label>
              <select
                id="turno"
                name="turno"
                value={formData.turno}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              >
                <option value="">Selecione um turno</option>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>

            {/* Cargo */}
            <div>
              <label htmlFor="cargo" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Cargo
              </label>
              <select
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              >
                <option value="">Selecione um cargo</option>
                <option value="gerente">Gerente</option>
                <option value="supervisor">Supervisor</option>
                <option value="operacional">Operacional</option>
                <option value="administrativo">Administrativo</option>
                <option value="seguranca">Segurança</option>
              </select>
            </div>

            {/* Data de Admissão */}
            <div>
              <label htmlFor="dataAdmissao" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Data de Admissão
              </label>
              <input
                id="dataAdmissao"
                type="date"
                name="dataAdmissao"
                value={formData.dataAdmissao}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 mt-10 justify-center md:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 rounded-lg font-semibold border-2 transition-all duration-200"
              style={{
                borderColor: "#FF9966",
                color: "#FF9966",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFF5EE"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105"
              style={{ backgroundColor: "#FF9966" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FA541C"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FF9966"
              }}
            >
              Salvar Funcionário
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
