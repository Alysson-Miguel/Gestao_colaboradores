"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, ArrowLeft, FileText, CheckCircle, AlertCircle } from "lucide-react"

import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import api from "../../services/api"

export default function ImportarColaboradores() {

  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const [status, setStatus] = useState({
    message: "",
    type: ""
  })
  const [checkingStatus, setCheckingStatus] = useState(false);

  function validateFile(file) {

    if (!file) return false

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setStatus({
        message: "Apenas arquivos CSV são permitidos",
        type: "error"
      })
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus({
        message: "Arquivo muito grande (máx. 10MB)",
        type: "error"
      })
      return false
    }

    return true
  }

  function handleFile(file) {

    if (!validateFile(file)) return

    setFile(file)

    setStatus({
      message: "Arquivo válido. Pronto para importação.",
      type: "success"
    })
  }

  async function handleImport() {

    if (!file) {
      setStatus({
        message: "Selecione um arquivo CSV",
        type: "error"
      })
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {

      setLoading(true)
      setProgress(0)

      const res = await api.post("/colaboradores/import", formData, {

        headers: {
          "Content-Type": "multipart/form-data"
        },

        timeout: 20000,

        onUploadProgress: (progressEvent) => {

          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )

          setProgress(percent)
        }

      })

      setStatus({
        message: res.data?.message || "Importação iniciada com sucesso.",
        type: "success"
      })

      startStatusCheck();
      setFile(null)
      setProgress(0)

      const input = document.getElementById("fileInput")
      if (input) input.value = ""

    } catch (err) {

      const errorMsg =
        err.response?.data?.message ||
        "Erro ao enviar o arquivo. Verifique o CSV."

      setStatus({
        message: errorMsg,
        type: "error"
      })

    } finally {
      setLoading(false)
    }
  }
  function startStatusCheck() {

    setCheckingStatus(true);

    const interval = setInterval(async () => {

      try {

        const res = await api.get("/colaboradores/import-status");

        if (res.data.status === "completed") {

          clearInterval(interval);
          setCheckingStatus(false);

          setStatus({
            message: `Importação finalizada ✔

  Criados: ${res.data.criados}
  Atualizados: ${res.data.atualizados}
  Ignorados: ${res.data.skipped}
  Erros: ${res.data.erros}`,
            type: res.data.erros > 0 ? "error" : "success"
          });

        }

      } catch (err) {
        console.error("Erro ao verificar status:", err);
      }

    }, 3000); // verifica a cada 3 segundos
  }

  function handleDrop(e) {

    e.preventDefault()

    const droppedFile = e.dataTransfer.files[0]

    if (droppedFile) {
      handleFile(droppedFile)
    }
  }
  return (

    <div className="flex min-h-screen bg-[#0D0D0D] text-white">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">

        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 max-w-2xl mx-auto space-y-6">

          {/* HEADER */}

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate("/colaboradores")}
              className="p-2 rounded-lg bg-[#1A1A1C] hover:bg-[#2A2A2C]"
            >
              <ArrowLeft size={18}/>
            </button>

            <div>

              <h1 className="text-2xl font-semibold">
                Importar Colaboradores
              </h1>

              <p className="text-sm text-[#BFBFC3]">
                Envie um CSV para iniciar a importação automática
              </p>

            </div>

          </div>

          {/* STATUS */}

          {status.message && (

            <div className={`p-4 rounded-xl flex items-center gap-2 border ${
              status.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>

              {status.type === "success"
                ? <CheckCircle size={18}/>
                : <AlertCircle size={18}/>}

              {status.message}

            </div>

          )}

          {checkingStatus && (
            <div className="p-4 rounded-xl border bg-blue-500/10 border-blue-500/30 text-blue-400">
              Processando importação... aguarde ⏳
            </div>
          )}

          {/* DROP AREA */}

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-[#1A1A1C] border border-dashed border-[#3D3D40] rounded-2xl p-8 text-center hover:border-orange-500 transition"
          >

            <Upload size={30} className="mx-auto text-orange-400 mb-3"/>

            <p className="text-sm text-[#BFBFC3] mb-3">
              Arraste o arquivo CSV aqui
            </p>

            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={(e) => handleFile(e.target.files[0])}
              className="hidden"
            />

            <button
              onClick={() => document.getElementById("fileInput").click()}
              className="px-4 py-2 rounded-lg bg-[#2A2A2C] hover:bg-[#3D3D40]"
            >
              Selecionar arquivo
            </button>

          </div>

          {/* FILE INFO */}

          {file && (

            <div className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <FileText className="text-orange-400"/>

                <div>

                  <p className="font-medium">{file.name}</p>

                  <p className="text-xs text-[#BFBFC3]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>

                </div>

              </div>

              <button
                onClick={() => setFile(null)}
                className="text-red-400 text-sm hover:underline"
              >
                remover
              </button>

            </div>

          )}

          {/* PROGRESS */}

          {loading && (

            <div className="bg-[#1A1A1C] border border-[#3D3D40] rounded-xl p-4">

              <div className="flex justify-between text-xs mb-1">
                <span>Enviando arquivo...</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full bg-[#2A2A2C] h-2 rounded">

                <div
                  style={{ width: `${progress}%` }}
                  className="bg-orange-500 h-2 rounded transition-all"
                />

              </div>

            </div>

          )}

          {/* IMPORT BUTTON */}

          <button
            onClick={handleImport}
            disabled={!file || loading}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
              loading || !file
                ? "bg-[#2A2A2C] text-[#BFBFC3] cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >

            {loading
              ? "Enviando..."
              : "Iniciar Importação"}

          </button>

        </main>

      </div>

    </div>
  )
}