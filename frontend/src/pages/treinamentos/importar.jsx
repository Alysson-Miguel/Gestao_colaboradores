"use client"

import { useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Upload, ArrowLeft, Download, CheckCircle, AlertCircle,
  Loader2, FileSpreadsheet, Users, ChevronRight, File,
  X, Printer, ExternalLink, RefreshCw, Info,
} from "lucide-react"
import * as XLSX from "xlsx"
import MainLayout from "../../components/MainLayout"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import { TreinamentosAPI } from "../../services/treinamentos"
import { printAtaTreinamento } from "../../utils/printAtaTreinamento"

/* =====================================================
   HELPERS
===================================================== */
function parseDateBR(raw) {
  if (!raw) return null
  if (raw instanceof Date) return raw
  const str = String(raw).trim()
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12)
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12)
  return null
}

function fmtDateBR(raw) {
  const d = parseDateBR(raw)
  if (!d) return raw || "-"
  return d.toLocaleDateString("pt-BR")
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* =====================================================
   DOWNLOAD MODELO
===================================================== */
async function downloadModelo() {
  const ExcelJSModule = await import("exceljs")
  const ExcelJS = ExcelJSModule.default ?? ExcelJSModule
  const wb = new ExcelJS.Workbook()

  const wsT = wb.addWorksheet("Treinamento")
  wsT.columns = [
    { header: "Campo", key: "campo", width: 25 },
    { header: "Valor", key: "valor", width: 45 },
  ]
  wsT.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFA4C00" } }
    cell.alignment = { horizontal: "center" }
  })
  wsT.getRow(1).height = 22
  wsT.views = [{ state: "frozen", ySplit: 1 }]

  const campos = [
    ["data_treinamento", ""],
    ["processo",         ""],
    ["tema",             ""],
    ["soc",              ""],
    ["ops_id_instrutor", ""],
    ["local",            ""],
    ["horario_inicio",   ""],
    ["horario_fim",      ""],
  ]
  campos.forEach(([campo, valor]) => {
    const row = wsT.addRow({ campo, valor })
    row.getCell(1).font = { bold: true }
  })

  const wsP = wb.addWorksheet("Participantes")
  wsP.columns = [
    { header: "ops_id",   key: "ops_id",   width: 14 },
    { header: "nome",     key: "nome",     width: 35 },
    { header: "cargo",    key: "cargo",    width: 25 },
    { header: "empresa",  key: "empresa",  width: 20 },
    { header: "turno",    key: "turno",    width: 10 },
    { header: "setor",    key: "setor",    width: 20 },
    { header: "cpf",      key: "cpf",      width: 16 },
    { header: "presenca", key: "presenca", width: 13 },
  ]
  wsP.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } }
    cell.alignment = { horizontal: "center" }
  })
  wsP.getRow(1).height = 22
  wsP.views = [{ state: "frozen", ySplit: 1 }]

  const presLetter = wsP.getColumn("presenca").letter
  for (let r = 2; r <= 500; r++) {
    wsP.getCell(`${presLetter}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Presente,Ausente"'],
      showDropDown: false,
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "modelo_importacao_treinamento.xlsx"
  a.click()
  URL.revokeObjectURL(url)
}

/* =====================================================
   PARSE PLANILHA
===================================================== */
function parsePlanilha(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array", cellDates: true })
        const sheetT = wb.Sheets["Treinamento"]
        if (!sheetT) throw new Error('Aba "Treinamento" não encontrada. Use o modelo padrão.')
        const tRows = XLSX.utils.sheet_to_json(sheetT, { header: 1 })
        const hm = {}
        for (const row of tRows) {
          if (row[0]) hm[String(row[0]).toLowerCase().trim()] = row[1] ?? ""
        }
        const sheetP = wb.Sheets["Participantes"]
        if (!sheetP) throw new Error('Aba "Participantes" não encontrada. Use o modelo padrão.')
        const participantes = XLSX.utils.sheet_to_json(sheetP, { defval: "" })
          .filter((r) => String(r["ops_id"] || "").trim())
        resolve({ treinamento: hm, participantes })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo"))
    reader.readAsArrayBuffer(file)
  })
}

/* =====================================================
   VALIDAÇÃO
===================================================== */
function validarPlanilha({ treinamento: hm, participantes }) {
  const erros = []
  if (!hm["data_treinamento"]) erros.push("Campo obrigatório ausente: data_treinamento")
  else if (!parseDateBR(hm["data_treinamento"])) erros.push("data_treinamento: formato inválido. Use DD/MM/YYYY")
  if (!String(hm["processo"] || "").trim()) erros.push("Campo obrigatório ausente: processo")
  if (!String(hm["tema"] || "").trim())     erros.push("Campo obrigatório ausente: tema")
  if (!String(hm["soc"] || "").trim())      erros.push("Campo obrigatório ausente: soc")
  if (!String(hm["ops_id_instrutor"] || "").trim()) erros.push("Campo obrigatório ausente: ops_id_instrutor")
  if (!participantes.length) erros.push("Nenhum participante encontrado na aba Participantes")
  const seen = new Set()
  participantes.forEach((p, i) => {
    const opsId = String(p["ops_id"] || "").trim()
    if (!opsId) erros.push(`Linha ${i + 2}: ops_id obrigatório`)
    else if (seen.has(opsId)) erros.push(`Linha ${i + 2}: participante duplicado (${opsId})`)
    seen.add(opsId)
  })
  return erros
}

/* =====================================================
   SUB-COMPONENTES
===================================================== */

const STEPS = [
  { key: "upload",  num: 1, label: "Upload" },
  { key: "preview", num: 2, label: "Conferência" },
  { key: "success", num: 3, label: "Concluído" },
]

function Stepper({ current }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        return (
          <div key={s.key} className="flex items-center">
            {/* círculo */}
            <div className="flex items-center gap-2">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
                ${done   ? "bg-green-500 text-white"                    : ""}
                ${active ? "bg-orange-500 text-white ring-4 ring-orange-500/20" : ""}
                ${!done && !active ? "bg-surface-2 text-muted border border-default" : ""}
              `}>
                {done ? <CheckCircle size={13} /> : s.num}
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                active ? "text-orange-400" : done ? "text-green-400" : "text-muted"
              }`}>
                {s.label}
              </span>
            </div>
            {/* linha conectora */}
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-px w-8 md:w-12 transition-colors duration-500 ${done ? "bg-green-500/40" : "bg-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      <p className="text-sm font-medium leading-snug">{value || <span className="text-muted italic">—</span>}</p>
    </div>
  )
}

function Badge({ presente }) {
  const isPresente = String(presente || "").toLowerCase() !== "ausente"
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
      ${isPresente ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isPresente ? "bg-green-500" : "bg-red-400"}`} />
      {isPresente ? "Presente" : "Ausente"}
    </span>
  )
}

function ErrorList({ title, errors }) {
  const [expanded, setExpanded] = useState(true)
  if (!errors.length) return null
  return (
    <div className="rounded-2xl border border-red-500/25 bg-red-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left cursor-pointer"
      >
        <AlertCircle size={15} className="text-red-400 shrink-0" />
        <span className="flex-1 text-sm font-semibold text-red-400">{title}</span>
        <span className="text-xs text-muted">{errors.length} {errors.length === 1 ? "problema" : "problemas"}</span>
        <ChevronRight size={14} className={`text-muted transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <ul className="px-4 pb-3 space-y-1.5">
          {errors.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted">
              <span className="mt-0.5 w-1 h-1 rounded-full bg-red-400/60 shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */
export default function ImportarTreinamento() {
  const navigate   = useNavigate()
  const fileInputRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [step,         setStep]         = useState("upload")
  const [file,         setFile]         = useState(null)
  const [parsed,       setParsed]       = useState(null)
  const [parseErrors,  setParseErrors]  = useState([])
  const [serverErrors, setServerErrors] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [created,      setCreated]      = useState(null)
  const [isDragging,   setIsDragging]   = useState(false)

  /* ── lida com arquivo ──────────────────────────── */
  const handleFile = useCallback(async (f) => {
    if (!f) return
    const ext = f.name.split(".").pop().toLowerCase()
    if (!["xlsx", "xls"].includes(ext)) {
      setParseErrors(["Formato inválido. Use .xlsx ou .xls (modelo padrão)."])
      setFile(null)
      setParsed(null)
      return
    }
    setFile(f)
    setParseErrors([])
    setServerErrors([])
    setParsed(null)
    try {
      const data = await parsePlanilha(f)
      const erros = validarPlanilha(data)
      if (erros.length) {
        setParseErrors(erros)
        setParsed(null)
      } else {
        setParsed(data)
      }
    } catch (err) {
      setParseErrors([err.message || "Erro ao processar planilha"])
      setParsed(null)
    }
  }, [])

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  /* ── confirmar importação ─────────────────────── */
  async function handleConfirm() {
    setLoading(true)
    setProgress(0)
    setServerErrors([])
    try {
      const res = await TreinamentosAPI.importar(file, setProgress)
      if (res.success) {
        setCreated(res.data)
        setStep("success")
      } else {
        setServerErrors(res.errors?.map((e) => e.mensagem || JSON.stringify(e)) || ["Erro desconhecido"])
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setServerErrors(data.errors.map((e) => (e.linha ? `Linha ${e.linha}: ${e.mensagem}` : e.mensagem || JSON.stringify(e))))
      } else {
        setServerErrors([data?.message || "Erro ao importar treinamento"])
      }
    } finally {
      setLoading(false)
    }
  }

  function resetar() {
    setStep("upload"); setFile(null); setParsed(null)
    setParseErrors([]); setServerErrors([])
    setCreated(null); setProgress(0)
  }

  const hm = parsed?.treinamento || {}
  const participantes = parsed?.participantes || []
  const presenteCount = participantes.filter(
    (p) => String(p["presenca"] || "").toLowerCase() !== "ausente"
  ).length

  /* ── render ───────────────────────────────────── */
  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />
      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">

          {/* ── Cabeçalho ────────────────────────── */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/treinamentos")}
              className="mt-0.5 p-2 rounded-xl bg-surface hover:bg-surface-2 border border-default transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold leading-tight">Importar Treinamento</h1>
              <p className="text-sm text-muted mt-0.5">Cadastre um treinamento completo via planilha Excel</p>
            </div>
          </div>

          {/* ── Stepper ──────────────────────────── */}
          <Stepper current={step} />

          {/* ═══════════════════════════════════════
              STEP 1 — UPLOAD
          ═══════════════════════════════════════ */}
          {step === "upload" && (
            <div className="space-y-4">

              {/* Card: Baixar modelo */}
              <div className="bg-surface border border-default rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={20} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Modelo padrão (.xlsx)</p>
                  <p className="text-xs text-muted mt-0.5">2 abas: Treinamento (dados) + Participantes (lista)</p>
                </div>
                <button
                  onClick={downloadModelo}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Download size={13} />
                  Baixar
                </button>
              </div>

              {/* Dica de preenchimento */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-surface border border-default text-xs text-muted">
                <Info size={13} className="shrink-0 mt-0.5 text-orange-400/70" />
                <span>
                  Preencha a aba <strong className="text-page">Treinamento</strong> com os dados do evento e a aba{" "}
                  <strong className="text-page">Participantes</strong> com um colaborador por linha.
                  Campos obrigatórios: <em>data_treinamento, processo, tema, soc, ops_id_instrutor</em>.
                </span>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging
                    ? "border-orange-500 bg-orange-500/5 scale-[1.01]"
                    : file && !parseErrors.length
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-default hover:border-orange-500/60 hover:bg-orange-500/3 bg-surface"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />

                {file && !parseErrors.length ? (
                  /* arquivo ok */
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                      <CheckCircle size={24} className="text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{file.name}</p>
                      <p className="text-xs text-muted mt-1">{fmtBytes(file.size)} · {participantes.length} participante(s)</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); resetar() }}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-page transition-colors cursor-pointer"
                    >
                      <X size={11} /> Remover arquivo
                    </button>
                  </div>
                ) : (
                  /* idle / dragging */
                  <div className="space-y-3 pointer-events-none">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-colors ${
                      isDragging ? "bg-orange-500/20" : "bg-surface-2"
                    }`}>
                      <Upload size={22} className={isDragging ? "text-orange-400" : "text-muted"} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {isDragging ? "Solte o arquivo aqui" : "Arraste o arquivo ou clique para selecionar"}
                      </p>
                      <p className="text-xs text-muted mt-1">Aceito: .xlsx, .xls — máx. 10 MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Erros de parse */}
              <ErrorList title="Problemas encontrados no arquivo" errors={parseErrors} />

              {/* Botão avançar */}
              <button
                onClick={() => setStep("preview")}
                disabled={!parsed || !!parseErrors.length}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Revisar dados
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 2 — PREVIEW
          ═══════════════════════════════════════ */}
          {step === "preview" && parsed && (
            <div className="space-y-4">

              {/* Resumo do treinamento */}
              <div className="bg-surface border border-default rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-default">
                  <FileSpreadsheet size={15} className="text-orange-400" />
                  <span className="text-sm font-semibold">Dados do Treinamento</span>
                  <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-medium">Rascunho</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 px-5 py-4">
                  <InfoRow label="Data"         value={fmtDateBR(hm["data_treinamento"])} />
                  <InfoRow label="Processo"     value={String(hm["processo"] || "")} />
                  <InfoRow label="SOC"          value={String(hm["soc"] || "")} />
                  <InfoRow label="Tema"         value={String(hm["tema"] || "")} />
                  <InfoRow label="Instrutor"    value={String(hm["ops_id_instrutor"] || "")} />
                  <InfoRow label="Local"        value={String(hm["local"] || "")} />
                  {(hm["horario_inicio"] || hm["horario_fim"]) && (
                    <InfoRow
                      label="Horário"
                      value={[hm["horario_inicio"], hm["horario_fim"]].filter(Boolean).join(" – ")}
                    />
                  )}
                </div>
              </div>

              {/* Participantes */}
              <div className="bg-surface border border-default rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-default">
                  <Users size={15} className="text-orange-400" />
                  <span className="text-sm font-semibold">Participantes</span>
                  <div className="ml-auto flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">
                      {presenteCount} presentes
                    </span>
                    {participantes.length - presenteCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
                        {participantes.length - presenteCount} ausentes
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface">
                      <tr className="border-b border-default text-muted">
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide">#</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide">OpsId</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide hidden sm:table-cell">CPF</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide hidden md:table-cell">Nome</th>
                        <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide">Presença</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantes.map((p, i) => (
                        <tr key={i} className="border-b border-default/40 hover:bg-surface-2/50 transition-colors">
                          <td className="px-4 py-2.5 text-muted tabular-nums">{i + 1}</td>
                          <td className="px-4 py-2.5 font-mono font-medium">{String(p["ops_id"] || "")}</td>
                          <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{String(p["cpf"] || "—")}</td>
                          <td className="px-4 py-2.5 hidden md:table-cell">{String(p["nome"] || "—")}</td>
                          <td className="px-4 py-2.5">
                            <Badge presente={p["presenca"]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-2.5 border-t border-default bg-surface-2/30 text-xs text-muted">
                  {participantes.length} participante(s) no total
                </div>
              </div>

              {/* Erros do servidor */}
              <ErrorList title="Erros na validação do servidor" errors={serverErrors} />

              {/* Barra de progresso */}
              {loading && (
                <div className="space-y-1.5">
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" />
                    Importando... {progress}%
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("upload"); setServerErrors([]) }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border border-default hover:bg-surface-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Importando...</>
                    : <><CheckCircle size={16} /> Confirmar Importação</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 3 — SUCCESS
          ═══════════════════════════════════════ */}
          {step === "success" && created && (
            <div className="space-y-4">

              {/* Banner de sucesso */}
              <div className="bg-surface border border-green-500/30 rounded-2xl overflow-hidden">
                <div className="px-5 pt-8 pb-6 text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} className="text-green-400" />
                  </div>
                  <h2 className="text-lg font-bold">Treinamento criado com sucesso!</h2>
                  <p className="text-sm text-muted">
                    {created.participantes?.length || 0} participante(s) cadastrado(s) · Status{" "}
                    <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-xs font-semibold">Rascunho</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 pb-5 border-t border-default pt-4">
                  <InfoRow label="Tema"     value={created.tema} />
                  <InfoRow label="Data"     value={fmtDateBR(created.dataTreinamento)} />
                  <InfoRow label="Processo" value={created.processo} />
                  <InfoRow label="SOC"      value={created.soc} />
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => printAtaTreinamento(created)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-default hover:bg-surface-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Printer size={15} />
                  Imprimir Ata de Presença
                </button>
                <button
                  onClick={() => navigate(`/treinamentos/${created.idTreinamento}`)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  <ExternalLink size={15} />
                  Ver Treinamento
                </button>
              </div>

              <button
                onClick={resetar}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-default hover:bg-surface-2 text-xs text-muted transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                Importar outro treinamento
              </button>
            </div>
          )}

        </main>
      </MainLayout>
    </div>
  )
}
