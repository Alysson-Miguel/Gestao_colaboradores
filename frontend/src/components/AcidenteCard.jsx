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

  // 🔥 Cor dinâmica por tipo (opcional)
  const tipoColor =
    tipo.toLowerCase().includes("grave")
      ? "text-red-400"
      : tipo.toLowerCase().includes("leve")
      ? "text-yellow-400"
      : "text-orange-400";

  return (
    <div className="
      bg-linear-to-br from-[#1A1A1C] to-[#151517]
      border border-[#2F2F33]
      rounded-2xl
      p-6
      transition-all
      hover:border-[#FA4C00]/40
      hover:shadow-lg
      hover:shadow-[#FA4C00]/5
    ">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className="
            w-11 h-11
            rounded-xl
            bg-[#2A2A2C]
            flex items-center justify-center
            border border-[#3D3D40]
          ">
            <AlertTriangle size={18} className="text-[#FA4C00]" />
          </div>

          <div>
            {/* Nome */}
            <p className="text-base font-semibold text-white">
              {nome}
            </p>

            {/* Tipo */}
            <p className={`text-sm font-medium mt-1 ${tipoColor}`}>
              {tipo}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#9CA3AF] mt-3">
              <span className="flex items-center gap-1">
                <Calendar size={14} /> {dt}
              </span>

              <span className="flex items-center gap-1">
                <Clock size={14} /> {hora}
              </span>

              <span className="flex items-center gap-1">
                <MapPin size={14} /> {acidente.localOcorrencia || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Lado direito */}
        <div className="text-right space-y-3">
          {/* Registrado por */}
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">
              Registrado por
            </p>
            <p className="text-sm font-medium text-white flex items-center gap-1 justify-end">
              <User size={14} />
              {registradoPor}
            </p>
          </div>

          {/* Evidências */}
          <div className="
            inline-flex items-center gap-2
            px-3 py-1.5
            rounded-full
            bg-[#2A2A2C]
            border border-[#3D3D40]
            text-xs
            text-[#BFBFC3]
          ">
            <Camera size={14} />
            {fotosCount} foto{fotosCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div className="
        mt-5
        bg-[#0D0D0D]
        border border-[#2F2F33]
        rounded-xl
        p-4
      ">
        <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">
          Ações Imediatas
        </p>

        <p className="text-sm text-white mt-2 leading-relaxed line-clamp-3">
          {acidente.acoesImediatas || "-"}
        </p>
      </div>

      {/* Integração */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#9CA3AF]">
        <span>
          Integração:{" "}
          <span className="text-white font-medium">
            {acidente.participouIntegracao ? "Sim" : "Não"}
          </span>
        </span>

        {acidente.parteCorpoAtingida && (
          <span>
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