import { ArrowLeftRight, Ban, CircleCheck, Clock, Hourglass, TimerOff, Truck } from "lucide-react";

/** Status da Sinergia Interna: texto + ícone + cor (nunca só cor). */
export const STATUS = {
  SOLICITADA: { rotulo: "Solicitada", cor: "#8B8B93", Icone: Clock },
  EM_DESLOCAMENTO: { rotulo: "Em deslocamento", cor: "#3B82F6", Icone: Truck },
  SINERGIA_ATIVA: { rotulo: "Sinergia ativa", cor: "#FA4C00", Icone: ArrowLeftRight },
  AGUARDANDO_RETORNO: { rotulo: "Aguardando retorno", cor: "#F59E0B", Icone: Hourglass },
  FINALIZADA: { rotulo: "Finalizada", cor: "#22C55E", Icone: CircleCheck },
  CANCELADA: { rotulo: "Cancelada", cor: "#8B8B93", Icone: Ban },
  EXPIRADA: { rotulo: "Expirada", cor: "#FF453A", Icone: TimerOff },
};

export const STATUS_EM_ANDAMENTO = ["SOLICITADA", "EM_DESLOCAMENTO", "SINERGIA_ATIVA", "AGUARDANDO_RETORNO"];

const pad = (n) => String(n).padStart(2, "0");

export function formatarHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatarDia(valor) {
  if (!valor) return "—";
  const texto = String(valor).slice(0, 10);
  const [y, m, d] = texto.split("-");
  return `${d}/${m}/${y}`;
}

export function formatarDuracao(minutos) {
  if (minutos == null) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h ? `${h}h${pad(m)}` : `${m} min`;
}

/** Valor de <input type="datetime-local"> a partir de uma data (horário local). */
export function paraInputLocal(data) {
  const d = data instanceof Date ? data : new Date(data);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ROTULO_EVENTO = {
  SOLICITADA: "Solicitada",
  ENVIADA: "Envio confirmado",
  QR_GERADO: "QR Code gerado",
  QR_REEMITIDO: "QR Code reemitido",
  ETIQUETA_GERADA: "Etiqueta impressa",
  QR_LIDO_DESTINO: "QR de ida lido",
  QR_LIDO_ORIGEM: "QR de retorno lido",
  CHEGADA_CONFIRMADA: "Chegada confirmada no destino",
  FINALIZADA_NO_DESTINO: "Finalizada pelo destino (aguardando retorno)",
  FIM_PREVISTO_ATINGIDO: "Fim previsto atingido (aguardando retorno)",
  PRORROGADA: "Prorrogada",
  RETORNO_CONFIRMADO: "Retorno confirmado na origem",
  RETORNO_CONFIRMADO_MANUAL: "Retorno confirmado manualmente",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

const CODIGO_DA_ESTEIRA = {
  "esteira u": "ESTEIRA_U",
  "esteira linear": "LINEAR",
  "esteira termoplastica": "TERMOPLASTICA",
  "esteira full": "FULL",
};

/** Código da área de sinergia que corresponde à esteira (pelo nome), ou null. */
export function codigoDaEsteira(nome) {
  const chave = String(nome || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
  return CODIGO_DA_ESTEIRA[chave] || null;
}
