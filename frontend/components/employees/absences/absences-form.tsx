"use client"

import type React from "react"
import { useState } from "react"

interface FormData {
  funcionario: string
  motivo: string
  dataInicial: string
  dataFinal: string
  descricao: string
  anexo: File | null
}

interface Employee {
  id: string
  nome: string
}

const mockEmployees: Employee[] = [
  { id: "1", nome: "João Silva" },
  { id: "2", nome: "Maria Santos" },
  { id: "3", nome: "Carlos Oliveira" },
  { id: "4", nome: "Ana Costa" },
  { id: "5", nome: "Pedro Ferreira" },
  { id: "6", nome: "Lucia Marques" },
]

const absenceReasons = [
  { value: "doenca", label: "Doença" },
  { value: "falta", label: "Falta" },
  { value: "atraso", label: "Atraso" },
  { value: "licenca", label: "Licença" },
  { value: "folga", label: "Folga" },
  { value: "outro", label: "Outro" },
]

export default function AbsencesForm() {
  const [formData, setFormData] = useState<FormData>({
    funcionario: "",
    motivo: "",
    dataInicial: "",
    dataFinal: "",
    descricao: "",
    anexo: null,
  })

  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [fileName, setFileName] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEmployeeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      funcionario: value,
    }))

    if (value.length > 0) {
      const filtered = mockEmployees.filter((emp) => emp.nome.toLowerCase().includes(value.toLowerCase()))
      setFilteredEmployees(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredEmployees([])
      setShowSuggestions(false)
    }
  }

  const handleSelectEmployee = (employee: Employee) => {
    setFormData((prev) => ({
      ...prev,
      funcionario: employee.nome,
    }))
    setShowSuggestions(false)
    setFilteredEmployees([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        anexo: file,
      }))
      setFileName(file.name)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Ausência registrada:", formData)
    alert("Ausência registrada com sucesso!")
  }

  const handleCancel = () => {
    window.history.back()
  }

  return (
    <div className="max-w-4xl">
      <div className="rounded-3xl shadow-lg p-8 md:p-10" style={{ backgroundColor: "#FFFFFF" }}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Funcionário com Autocomplete */}
            <div className="md:col-span-2">
              <label htmlFor="funcionario" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Funcionário
              </label>
              <div className="relative">
                <input
                  id="funcionario"
                  type="text"
                  name="funcionario"
                  value={formData.funcionario}
                  onChange={handleEmployeeSearch}
                  onFocus={() => formData.funcionario.length > 0 && setShowSuggestions(true)}
                  placeholder="Digite o nome do funcionário"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
                />

                {/* Autocomplete Suggestions */}
                {showSuggestions && filteredEmployees.length > 0 && (
                  <div className="absolute top-full left-0 right-0 border border-gray-300 rounded-lg mt-1 bg-white shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredEmployees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => handleSelectEmployee(employee)}
                        className="w-full px-4 py-2 text-left hover:bg-orange-100 transition-all"
                        style={{ "--hover-bg": "#FFF5EE" } as React.CSSProperties}
                      >
                        {employee.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Motivo da Ausência */}
            <div>
              <label htmlFor="motivo" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Motivo da Ausência
              </label>
              <select
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all bg-white"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              >
                <option value="">Selecione um motivo</option>
                {absenceReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Inicial */}
            <div>
              <label htmlFor="dataInicial" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Data Inicial
              </label>
              <input
                id="dataInicial"
                type="date"
                name="dataInicial"
                value={formData.dataInicial}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* Data Final */}
            <div>
              <label htmlFor="dataFinal" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Data Final
              </label>
              <input
                id="dataFinal"
                type="date"
                name="dataFinal"
                value={formData.dataFinal}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label htmlFor="descricao" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Descrição Curta
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descreva brevemente o motivo da ausência"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none"
                style={{ "--tw-ring-color": "#FF9966" } as React.CSSProperties}
              />
            </div>

            {/* Upload de Anexos */}
            <div className="md:col-span-2">
              <label htmlFor="anexo" className="block text-sm font-semibold mb-2" style={{ color: "#1A1A1A" }}>
                Anexos (opcional)
              </label>
              <div className="relative">
                <input
                  id="anexo"
                  type="file"
                  name="anexo"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                />
                <label
                  htmlFor="anexo"
                  className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-all"
                  style={{
                    borderColor: "#FF9966",
                    backgroundColor: fileName ? "#FFF5EE" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!fileName) {
                      e.currentTarget.style.backgroundColor = "#FFF5EE"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!fileName) {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📎</div>
                    <p className="text-sm font-medium" style={{ color: "#FF9966" }}>
                      {fileName || "Clique ou arraste um arquivo aqui"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#999" }}>
                      PDF, JPG, PNG, DOC, DOCX (máx. 5MB)
                    </p>
                  </div>
                </label>
              </div>
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
              Registrar Ausência
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
