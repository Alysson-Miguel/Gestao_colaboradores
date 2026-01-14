import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
} from "lucide-react";

import { Printer } from "lucide-react";
import { printAtaTreinamento } from "../../utils/printAtaTreinamento";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

/* =====================================================
   PAGE — DETALHES DO TREINAMENTO
===================================================== */
export default function DetalhesTreinamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treinamento, setTreinamento] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/treinamentos`);
        const found = res.data.data.find(
        (t) => t.idTreinamento === Number(id)
        );

        if (!found) {
        navigate("/treinamentos");
        return;
        }

        setTreinamento(found);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, logout, navigate]);

  /* ================= FINALIZAR ================= */
  const finalizarTreinamento = async () => {
    if (!file) {
      alert("Selecione o PDF da ata");
      return;
    }

    setUploading(true);
    try {
      // 1️⃣ Solicita URL de upload (presign)
      const presign = await api.post(
        `/treinamentos/${treinamento.idTreinamento}/presign-ata`
      );

      const { uploadUrl, key } = presign.data;

      // 2️⃣ Upload direto para o Cloudflare R2
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: file,
      });

      // 3️⃣ Finaliza o treinamento salvando a key no banco
      await api.post(
        `/treinamentos/${treinamento.idTreinamento}/finalizar`,
        {
          documentoKey: key,
          nome: file.name,
          mime: file.type,
          size: file.size,
        }
      );

      alert("Treinamento finalizado com sucesso");
      navigate("/treinamentos");
    } catch (err) {
      console.error(err);
      alert("Erro ao finalizar treinamento");
    } finally {
      setUploading(false);
    }
  };

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#BFBFC3]">
        Carregando…
      </div>
    );
  }

  if (!treinamento) return null;

  const statusColor =
    treinamento.status === "FINALIZADO"
      ? "text-[#34C759]"
      : "text-[#FFD60A]";

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 space-y-8 max-w-6xl">
          {/* HEADER */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/treinamentos")}
              className="text-[#BFBFC3] hover:text-white"
            >
              <ArrowLeft />
            </button>

            <div>
              <h1 className="text-2xl font-semibold">
                Detalhes do Treinamento
              </h1>
              <p className={`text-sm ${statusColor}`}>
                Status: {treinamento.status}
              </p>
            </div>
          </div>

          {/* CARD PRINCIPAL */}
          <div className="bg-[#1A1A1C] rounded-2xl p-6 space-y-6">
            {/* CABEÇALHO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#BFBFC3]">Data</span>
                <p>
                  {new Date(
                    treinamento.dataTreinamento
                  ).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div>
                <span className="text-[#BFBFC3]">SOC</span>
                <p>{treinamento.soc}</p>
              </div>

              <div>
                <span className="text-[#BFBFC3]">Processo</span>
                <p>{treinamento.processo}</p>
              </div>

              <div>
                <span className="text-[#BFBFC3]">Tema</span>
                <p>{treinamento.tema}</p>
              </div>

              <div>
                <span className="text-[#BFBFC3]">Líder Responsável</span>
                <p>{treinamento.liderResponsavel?.nomeCompleto}</p>
              </div>
            </div>

            {/* SETORES */}
            <div>
              <h3 className="text-sm text-[#BFBFC3] mb-2">Setores</h3>
              <div className="flex flex-wrap gap-2">
                {treinamento.setores.map((s) => (
                  <span
                    key={s.idTreinamentoSetor}
                    className="px-3 py-1 rounded-full text-xs bg-[#262628]"
                  >
                    {s.setor?.nomeSetor}
                  </span>
                ))}
              </div>
            </div>

            {/* PARTICIPANTES */}
            <div>
              <h3 className="text-sm text-[#BFBFC3] mb-2">
                Participantes ({treinamento.participantes.length})
              </h3>

              <div className="border border-[#2A2A2C] rounded-xl overflow-hidden">
                {treinamento.participantes.map((p) => (
                  <div
                    key={p.idTreinamentoParticipante}
                    className="px-4 py-2 flex justify-between text-sm border-b border-[#2A2A2C]"
                  >
                    <span>{p.colaborador?.nomeCompleto || p.opsId}</span>
                    <span className="text-[#BFBFC3]">{p.cpf || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* AÇÕES */}
            <div className="flex flex-wrap gap-3">
            <button
                onClick={() => printAtaTreinamento(treinamento)}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#262628] hover:bg-[#3A3A3C]"
            >
                <Printer size={16} />
                Imprimir Ata
            </button>
            </div>
                
            {/* FINALIZAÇÃO */}
            {treinamento.status === "ABERTO" && (
            <div className="space-y-4">
                <h3 className="text-sm text-[#BFBFC3]">
                Finalizar Treinamento (Upload da ATA)
                </h3>

                <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="block text-sm"
                />

                <button
                onClick={finalizarTreinamento}
                disabled={uploading || !file}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl
                    ${
                    uploading || !file
                        ? "bg-[#3A3A3C] cursor-not-allowed"
                        : "bg-[#FA4C00] hover:bg-[#D84300]"
                    }`}
                >
                <CheckCircle size={16} />
                Finalizar Treinamento
                </button>
            </div>
            )}

            {/* PDF FINAL */}
            {treinamento.status === "FINALIZADO" &&
              treinamento.ataPdfUrl && (
                <div className="flex items-center gap-2 text-[#34C759]">
                  <FileText size={16} />
                  ATA anexada
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
