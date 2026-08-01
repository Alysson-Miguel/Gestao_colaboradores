import { CheckCircle, Clock, XCircle } from "lucide-react";

export const TIPO_LABEL = {
  FOLGA: "Folga",
  BANCO_HORAS: "Banco de Horas",
  SINERGIA: "Sinergia",
  TROCA_DSR: "Troca de DSR",
};

export const DESTINO_SINERGIA_LABEL = {
  FULL: "FULL",
  TRATATIVAS: "Tratativas",
  OUTRA_OPERACAO: "Outra Operação",
};

export const STATUS_COLOR = {
  PENDENTE: "#FF9F0A",
  APROVADA: "#34C759",
  REPROVADA: "#FF453A",
};

export const STATUS_LABEL = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
};

export function StatusOperacionalBadge({ status }) {
  if (status === "APROVADA")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
        <CheckCircle size={11} /> Aprovada
      </span>
    );
  if (status === "REPROVADA")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20">
        <XCircle size={11} /> Reprovada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
      <Clock size={11} /> Pendente
    </span>
  );
}

export function TipoBadge({ tipo }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20">
      {TIPO_LABEL[tipo] || tipo}
    </span>
  );
}

export function formatDateOnly(str) {
  if (!str) return "—";
  return str.slice(0, 10).split("-").reverse().join("/");
}
