// src/components/AcidenteCard.jsx
import {
  AlertTriangle,
  Camera,
  MapPin,
  Calendar,
  Clock,
  User,
} from "lucide-react";

export default function AcidenteCard({ acidente }) {
  /* =========================
     FORMAT DATA
  ========================= */

  const dataFormatada = (() => {
    if (!acidente?.dataOcorrencia) return "-";

    const d = new Date(acidente.dataOcorrencia);
    if (isNaN(d)) return "-";

    return d.toLocaleDateString("pt-BR");
  })();

  const horaFormatada = (() => {
    if (!acidente?.horarioOcorrencia) return "-";

    const raw = acidente.horarioOcorrencia;

    // Se for string HH:mm:ss
    if (typeof raw === "string" && raw.length <= 8) {
      return raw.slice(0, 5);
    }

    // Se vier como ISO timestamp
    const d = new Date(raw);
    if (!isNaN(d)) {
      return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return "-";
  })();

  const nome = acidente?.colaborador?.nomeCompleto || "-";
  const fotosCount = acidente?.evidencias?.length || 0;

  const registradoPor =
    acidente?.nomeRegistrante ||
    acidente?.registradoPor ||
    "Sistema";

  const tipo = acidente?.tipoOcorrencia || "-";

  /* =========================
     BADGE TIPO
  ========================= */

  const badgeTipoClass = (() => {
    const lower = tipo.toLowerCase();

    if (lower.includes("grave")) {
      return "bg-red-500/10 text-red-400 border border-red-500/30";
    }

    if (lower.includes("leve")) {
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30";
    }

    return "bg-orange-500/10 text-orange-400 border border-orange-500/30";
  })();

  return (
    <div
      className="
        bg-gradient-to-br from-[#1A1A1C] to-[#151517]
        border border-[#2F2F33]
        rounded-2xl
        p-5 lg:p-6
        transition-all duration-300
        hover:border-[#FA4C00]/40
        hover:shadow-xl
        hover:shadow-[#FA4C00]/5
      "
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
        
        {/* BLOCO ESQUERDO */}
        <div className="flex items-start gap-4 min-w-0">

          {/* Ícone */}
          <div
            className="
              shrink-0
              w-11 h-11
              rounded-xl
              bg-[#2A2A2C]
              flex items-center justify-center
              border border-[#3D3D40]
            "
          >
            <AlertTriangle size={18} className="text-[#FA4C00]" />
          </div>

          <div className="min-w-0">
            {/* Nome */}
            <p className="text-lg font-semibold tracking-tight text-white truncate">
              {nome}
            </p>

            {/* Tipo Badge */}
            <div className="mt-2">
              <span
                className={`
                  inline-flex items-center
                  px-2.5 py-1
                  rounded-full
                  text-xs font-medium
                  ${badgeTipoClass}
                `}
              >
                {tipo}
              </span>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#9CA3AF] mt-4">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar size={13} /> {dataFormatada}
              </span>

              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock size={13} /> {horaFormatada}
              </span>

              <span className="flex items-center gap-1 truncate max-w-[260px]">
                <MapPin size={13} />
                <span className="truncate">
                  {acidente?.localOcorrencia || "-"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* BLOCO DIREITO */}
        <div className="flex lg:flex-col justify-between lg:items-end gap-4 lg:text-right">
          
          {/* Registrado por */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
              Registrado por
            </p>

            <p className="text-sm font-semibold text-white flex items-center gap-1 lg:justify-end">
              <User size={14} />
              <span className="truncate max-w-[160px]">
                {registradoPor}
              </span>
            </p>
          </div>

          {/* Evidências */}
          <div
            className="
              inline-flex items-center gap-2
              px-3 py-1.5
              rounded-full
              bg-[#2A2A2C]
              border border-[#3D3D40]
              text-xs
              text-[#BFBFC3]
            "
          >
            <Camera size={13} />
            {fotosCount} foto{fotosCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* ================= AÇÕES IMEDIATAS ================= */}
      <div
        className="
          mt-6
          bg-gradient-to-br from-[#0D0D0D] to-[#111113]
          border border-[#2F2F33]
          rounded-xl
          p-4
          shadow-inner
        "
      >
        <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
          Ações Imediatas
        </p>

        <p className="text-sm text-white mt-3 leading-relaxed line-clamp-3">
          {acidente?.acoesImediatas || "-"}
        </p>
      </div>

      {/* ================= FOOTER INFO ================= */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#9CA3AF]">
        <span>
          Integração:{" "}
          <span className="text-white font-semibold">
            {acidente?.participouIntegracao ? "Sim" : "Não"}
          </span>
        </span>

        {acidente?.parteCorpoAtingida && (
          <span className="truncate">
            Parte afetada:{" "}
            <span className="text-white font-semibold">
              {acidente.parteCorpoAtingida}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}