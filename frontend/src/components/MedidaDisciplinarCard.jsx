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
    <div className="relative bg-[#141416] border border-[#2A2A2D] rounded-2xl p-6 transition-all hover:border-[#FA4C00]/40 hover:shadow-lg hover:shadow-[#FA4C00]/5">

      {/* BARRA LATERAL */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-[#FA4C00]" />

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1F1F22] flex items-center justify-center">
            <FileText size={20} className="text-[#FA4C00]" />
          </div>

          <div>
            <p className="text-base font-semibold text-white">
              {medida.colaborador?.nomeCompleto}
            </p>

            <div className="flex items-center gap-3 text-xs text-[#8B8B90] mt-1">
              <div className="flex items-center gap-1">
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

        {/* BADGE */}
        <div
          className={`px-3 py-1 text-xs rounded-full border font-medium ${tipoColor}`}
        >
          {medida.tipoMedida}
        </div>
      </div>

      {/* MOTIVO */}
      <div className="mt-8">
        <p className="text-sm text-[#BFBFC3] leading-relaxed">
          {medida.motivo}
        </p>
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                     bg-[#1F1F22] border border-[#2A2A2D]
                     hover:border-[#FA4C00]/50 hover:bg-[#1A1A1C]
                     transition-all"
        >
          <Download size={14} />
          Baixar PDF
        </button>
      </div>
    </div>
  );
}