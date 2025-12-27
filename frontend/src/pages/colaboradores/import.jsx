import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowLeft } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../services/api";

export default function ImportarColaboradores() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "", details: null }); // Adicionei 'details' pra erros/resumo

  async function handleImport() {
    if (!file) {
      setStatus({ message: "Selecione um arquivo CSV", type: "error" });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus({ message: "Apenas arquivos CSV são permitidos", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limite
      setStatus({ message: "Arquivo muito grande (máx. 5MB)", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setStatus({ message: "", type: "", details: null });
      const res = await api.post("/colaboradores/import", formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Axios auto-seta, mas explícito ajuda
        },
      });

      // Ajuste baseado na resposta do backend: res.data.message e res.data.data.resumo
      const resumo = res.data.data?.resumo || {};
      const erros = res.data.data?.erros || null;
      const message = res.data.message || "Importação concluída";

      let fullMessage = message;
      if (resumo.criados || resumo.atualizados) {
        fullMessage += `. Criados: ${resumo.criados || 0}, Atualizados: ${resumo.atualizados || 0}, Pulados: ${resumo.skipped || 0} (de ${resumo.totalLinhas || 0} linhas).`;
      }

      setStatus({ 
        message: fullMessage, 
        type: "success",
        details: erros ? { erros } : null // Se há erros, guarda pra mostrar
      });

      // Opcional: Limpa o arquivo após sucesso
      setTimeout(() => {
        setFile(null);
        document.getElementById('fileInput').value = '';
        // Se sucesso e sem erros, limpa details também
        if (!erros) setStatus({ message: "", type: "", details: null });
      }, 5000); // Aumentei pra 5s pra ler o resumo
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erro ao importar CSV. Verifique o formato e tente novamente.";
      setStatus({ 
        message: errorMsg, 
        type: "error",
        details: err.response?.data?.data?.erros || null // Captura erros do backend se houver
      });
      console.error("Erro no import:", err); // Para debug
    } finally {
      setLoading(false);
    }
  }

  const clearStatus = () => setStatus({ message: "", type: "", details: null });

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
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Importar Colaboradores</h1>
              <p className="text-sm text-[#BFBFC3]">Envie um arquivo CSV com os dados dos colaboradores</p>
            </div>
          </div>

          {/* STATUS MESSAGE */}
          {status.message && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              status.type === "success" 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
              <div>{status.message}</div>
              {status.details && (
                <details className="text-xs mt-2 p-2 bg-black/20 rounded">
                  <summary className="cursor-pointer font-medium mb-1">Detalhes (erros/pulos)</summary>
                  <ul className="list-disc list-inside space-y-1">
                    {Array.isArray(status.details.erros) ? (
                      status.details.erros.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))
                    ) : (
                      <li>{status.details.erros || 'Nenhum detalhe disponível'}</li>
                    )}
                  </ul>
                </details>
              )}
              <button onClick={clearStatus} className="float-right text-sm opacity-70 hover:opacity-100">×</button>
            </div>
          )}

          {/* UPLOAD SECTION */}
          <div className="bg-[#1A1A1C] border border-[#3D3D40] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload size={20} className="text-orange-400" />
              <h2 className="text-lg font-semibold">Arquivo CSV</h2>
            </div>

            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={(e) => {
                setFile(e.target.files[0]);
                clearStatus();
              }}
              className="block w-full text-sm text-[#BFBFC3] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2A2A2C] file:text-[#BFBFC3] hover:file:bg-[#3D3D40] mb-4"
            />

            {file && (
              <p className="text-sm text-[#BFBFC3] mb-4">
                Arquivo selecionado: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}

            <p className="text-xs text-[#BFBFC3] mb-4">
              <strong>Formato esperado:</strong> Colunas como "Ops ID", "Nome do Funcionário", "Matricula", "CPF", "E-mail", "Sexo", "Empresa", "Setor", "Cargo", "Jornada", "Data de admissão" (dd/mm/yyyy), "Horário de Jornada" (ex.: 05:25). Ajuste o CSV conforme necessário.
            </p>

            <button
              onClick={handleImport}
              disabled={!file || loading}
              className={`
                w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition
                ${loading || !file 
                  ? "bg-[#2A2A2C] text-[#BFBFC3] cursor-not-allowed" 
                  : "bg-orange-500 hover:bg-orange-600 text-white"
                }
              `}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importar CSV
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}