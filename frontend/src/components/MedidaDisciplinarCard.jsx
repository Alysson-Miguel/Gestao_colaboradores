import { FileText, Download, Calendar, User } from "lucide-react";
import { MedidasDisciplinaresAPI } from "../services/medidasDisciplinares";

export default function MedidaDisciplinarCard({ medida }) {
  async function handleDownload() {
    const res = await MedidasDisciplinaresAPI.presignDownload(
      medida.idMedida
    );
    window.open(res.data.data.url, "_blank");
  }

  const tipoColor =
    medida.tipoMedida?.toLowerCase().includes("advert")
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      : medida.tipoMedida?.toLowerCase().includes("susp")
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : "bg-[#FA4C00]/15 text-[#FA4C00] border-[#FA4C00]/30";

  return (
    <div
      className="
        relative
        bg-[#141416]
        border border-[#2A2A2D]
        rounded-2xl
        p-4 sm:p-6
        transition-all
        hover:border-[#FA4C00]/40
        hover:shadow-lg
        hover:shadow-[#FA4C00]/5
      "
    >
      {/* Barra lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-[#FA4C00]" />

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

        {/* Info esquerda */}
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1F1F22] flex items-center justify-center shrink-0">
            <FileText size={18} className="text-[#FA4C00]" />
          </div>

          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-white truncate">
              {medida.colaborador?.nomeCompleto}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B8B90] mt-2">
              <div className="flex items-center gap-1 truncate">
                <User size={12} />
                {medida.opsId}
              </div>

              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(
                  medida.dataAplicacao
                ).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div
          className={`
            self-start sm:self-auto
            px-3 py-1
            text-xs
            rounded-full
            border
            font-medium
            ${tipoColor}
          `}
        >
          {medida.tipoMedida}
        </div>
      </div>

      {/* ================= MOTIVO ================= */}
      <div className="mt-6">
        <p className="text-sm text-[#BFBFC3] leading-relaxed line-clamp-4">
          {medida.motivo}
        </p>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
        <button
          onClick={handleDownload}
          className="
            w-full sm:w-auto
            flex items-center justify-center gap-2
            px-4 py-2
            rounded-xl
            text-sm
            bg-[#1F1F22]
            border border-[#2A2A2D]
            hover:border-[#FA4C00]/50
            hover:bg-[#1A1A1C]
            transition-all
          "
        >
          <Download size={14} />
          Baixar PDF
        </button>
      </div>
    </div>
  );
}