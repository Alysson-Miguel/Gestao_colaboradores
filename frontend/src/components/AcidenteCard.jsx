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
  const dt = acidente.dataOcorrencia
    ? new Date(acidente.dataOcorrencia).toLocaleDateString("pt-BR")
    : "-";

  const hora = acidente.horarioOcorrencia
    ? acidente.horarioOcorrencia.slice(0, 5)
    : "-";

  const nome = acidente.colaborador?.nomeCompleto || "-";
  const fotosCount = acidente.evidencias?.length || 0;

  const registradoPor =
    acidente.nomeRegistrante ||
    acidente.registradoPor ||
    "Sistema";

  const tipo = acidente.tipoOcorrencia || "-";

  const tipoColor =
    tipo.toLowerCase().includes("grave")
      ? "text-red-400"
      : tipo.toLowerCase().includes("leve")
      ? "text-yellow-400"
      : "text-orange-400";

  return (
    <div
      className="
        bg-linear-to-br from-[#1A1A1C] to-[#151517]
        border border-[#2F2F33]
        rounded-2xl
        p-4 sm:p-5 lg:p-6
        transition-all
        hover:border-[#FA4C00]/40
        hover:shadow-lg
        hover:shadow-[#FA4C00]/5
      "
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-6">
        
        {/* BLOCO ESQUERDO */}
        <div className="flex items-start gap-4 min-w-0">
          
          {/* Ícone */}
          <div
            className="
              shrink-0
              w-10 h-10 sm:w-11 sm:h-11
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
            <p className="text-sm sm:text-base font-semibold text-white truncate">
              {nome}
            </p>

            {/* Tipo */}
            <p className={`text-xs sm:text-sm font-medium mt-1 ${tipoColor}`}>
              {tipo}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] sm:text-xs text-[#9CA3AF] mt-3">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Calendar size={13} /> {dt}
              </span>

              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock size={13} /> {hora}
              </span>

              <span className="flex items-center gap-1 truncate">
                <MapPin size={13} />{" "}
                <span className="truncate">
                  {acidente.localOcorrencia || "-"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* BLOCO DIREITO */}
        <div className="flex md:flex-col justify-between md:items-end gap-4 md:text-right">
          
          {/* Registrado por */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
              Registrado por
            </p>

            <p className="text-xs sm:text-sm font-medium text-white flex items-center gap-1 md:justify-end">
              <User size={14} />
              <span className="truncate max-w-[140px] sm:max-w-none">
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
              text-[11px] sm:text-xs
              text-[#BFBFC3]
            "
          >
            <Camera size={13} />
            {fotosCount} foto{fotosCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div
        className="
          mt-5
          bg-[#0D0D0D]
          border border-[#2F2F33]
          rounded-xl
          p-3 sm:p-4
        "
      >
        <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
          Ações Imediatas
        </p>

        <p className="text-xs sm:text-sm text-white mt-2 leading-relaxed line-clamp-3">
          {acidente.acoesImediatas || "-"}
        </p>
      </div>

      {/* INTEGRAÇÃO */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] sm:text-xs text-[#9CA3AF]">
        <span>
          Integração:{" "}
          <span className="text-white font-medium">
            {acidente.participouIntegracao ? "Sim" : "Não"}
          </span>
        </span>

        {acidente.parteCorpoAtingida && (
          <span className="truncate">
            Parte afetada:{" "}
            <span className="text-white font-medium">
              {acidente.parteCorpoAtingida}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}