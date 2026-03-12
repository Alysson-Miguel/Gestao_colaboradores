import { useEffect, useState, useRef } from "react";
import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import html2pdf from "html2pdf.js";
import QRCode from "qrcode";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../services/api";

import CartaAdvertenciaTemplate from "../../components/medidas_disciplinares/CartamedidaDisciplinarTemplate";

export default function SugestoesMedidaDisciplinar() {
  const navigate = useNavigate();
  const templateRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dadosCarta, setDadosCarta] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  async function load() {
    setLoading(true);

    try {
      const res = await api.get("/medidas-disciplinares/sugestoes");
      setSugestoes(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar sugestões");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function esperarRender() {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async function gerarPdfCarta() {
    const element = templateRef.current;

    if (!element) {
      throw new Error("Template da carta não renderizado");
    }

    const opt = {
      margin: 0,
      filename: "carta-advertencia.pdf",
      image: {
        type: "jpeg",
        quality: 1,
      },
      html2canvas: {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const root = clonedDoc.querySelector(".pdf-carta-root");

          if (!root) return;

          const allLinks = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
          allLinks.forEach((el) => el.remove());

          const allStyles = Array.from(clonedDoc.querySelectorAll("style"));
          allStyles.forEach((styleEl) => {
            const cssText = styleEl.textContent || "";

            const isTemplateStyle =
              cssText.includes(".md-page-root") ||
              cssText.includes(".md-header") ||
              cssText.includes(".md-box") ||
              cssText.includes(".md-footer");

            if (!isTemplateStyle) {
              styleEl.remove();
            }
          });

          clonedDoc.body.style.background = "#ffffff";
          clonedDoc.documentElement.style.background = "#ffffff";
        },
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    const worker = html2pdf().set(opt).from(element).toPdf();
    const blob = await worker.output("blob");

    return blob;
  }
  async function aprovar(sugestao) {

    if (processingId) return;

    if (!window.confirm("Aprovar esta medida disciplinar?")) return;

    try {

      setProcessingId(sugestao.idSugestao);

      const res = await api.post(
        `/medidas-disciplinares/sugestoes/${sugestao.idSugestao}/aprovar`
      );

      const medida = res.data.data;

      alert("Medida disciplinar criada com sucesso");

      navigate(`/medidas-disciplinares/${medida.idMedida}`);

    } catch (err) {

      console.error(err);
      alert("Erro ao aprovar sugestão");

    } finally {

      setProcessingId(null);

    }

  }

  async function rejeitar(id) {
    if (processingId) return;

    if (!window.confirm("Rejeitar esta sugestão?")) return;

    try {
      setProcessingId(id);

      await api.post(`/medidas-disciplinares/sugestoes/${id}/rejeitar`);

      await load();
      alert("Sugestão rejeitada com sucesso.");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message || "Erro ao rejeitar sugestão"
      );
    } finally {
      setProcessingId(null);
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

        <main className="p-8 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Sugestões de Medida Disciplinar
            </h1>

            <p className="text-sm text-[#BFBFC3]">
              Violações detectadas automaticamente pelo sistema
            </p>
          </div>

          {loading ? (
            <div className="text-[#BFBFC3]">
              Carregando sugestões...
            </div>
          ) : sugestoes.length === 0 ? (
            <div className="text-[#BFBFC3]">
              Nenhuma sugestão pendente
            </div>
          ) : (
            <div className="space-y-4">
              {sugestoes.map((s) => (
                <SugestaoCard
                  key={s.idSugestao}
                  sugestao={s}
                  onAprovar={() => aprovar(s)}
                  onRejeitar={rejeitar}
                  processing={processingId === s.idSugestao}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* TEMPLATE INVISÍVEL */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {dadosCarta && (
          <CartaAdvertenciaTemplate
            ref={templateRef}
            {...dadosCarta}
          />
        )}
      </div>
    </div>
  );
}

/* CARD */
function SugestaoCard({ sugestao, onAprovar, onRejeitar, processing }) {
  const colaborador = sugestao.colaborador;
  const data = new Date(sugestao.dataReferencia).toLocaleDateString("pt-BR");

  return (
    <div
      className="
        bg-[#1A1A1C]
        border border-[#3D3D40]
        rounded-xl
        p-5
        flex items-center justify-between gap-4
      "
    >
      <div className="space-y-1 min-w-0">
        <p className="font-medium">
          {colaborador?.nomeCompleto || "-"}
        </p>

        <p className="text-sm text-[#BFBFC3]">
          {String(sugestao.violacao || "-").replaceAll("_", " ")}
        </p>

        <p className="text-xs text-[#6B7280]">
          Data: {data}
        </p>

        <p className="text-xs text-[#FA4C00]">
          Consequência sugerida: {sugestao.consequencia}
        </p>
      </div>

      <div className="flex gap-3 shrink-0">
        <button
          onClick={() => onRejeitar(sugestao.idSugestao)}
          disabled={processing}
          className="
            flex items-center gap-2
            px-3 py-2
            rounded-lg
            bg-[#2A2A2C]
            hover:bg-[#3A3A3C]
            text-sm
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          <X size={16} />
          {processing ? "Processando..." : "Rejeitar"}
        </button>

        <button
          disabled={processing}
          onClick={onAprovar}
          className="
            flex items-center gap-2
            px-3 py-2
            rounded-lg
            bg-[#FA4C00]
            hover:bg-[#ff5a1a]
            text-sm
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          <Check size={16} />
          {processing ? "Processando..." : "Aprovar"}
        </button>
      </div>
    </div>
  );
}