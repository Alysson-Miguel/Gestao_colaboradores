// Turno e dia operacional específicos do Mapa Operacional (Label) — limites
// exatos definidos pelo usuário, sem as tolerâncias do getDateOperacional()
// genérico da empresa (backend/src/utils/dateOperacional.js), que serve a
// outras telas com regras próprias.
//
// T1: 06:00–13:59 | T2: 14:00–21:59 | T3: 22:00–05:59 (vira o dia: o T3 que
// começa às 22:00 de um dia operacional D só termina às 05:59 de D+1, então
// pertence sempre ao dia operacional D, não ao dia seguinte do calendário).

function agoraBrasil() {
  const now = new Date();
  const spString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spString);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatYMD(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function turnoDaHora(hora) {
  if (hora >= 6 && hora < 14) return "T1";
  if (hora >= 14 && hora < 22) return "T2";
  return "T3";
}

/**
 * Turno atual + dia operacional, a partir de um instante (default: agora em
 * Brasília). Dia operacional = data corrente, exceto no T3 antes das 06:00,
 * quando ainda pertence ao dia operacional anterior.
 */
function getTurnoOperacionalAtual(baseDate = agoraBrasil()) {
  const d = new Date(baseDate);
  const hora = d.getHours();
  const turno = turnoDaHora(hora);

  const diaOperacional = new Date(d);
  if (turno === "T3" && hora < 6) {
    diaOperacional.setDate(diaOperacional.getDate() - 1);
  }
  diaOperacional.setHours(0, 0, 0, 0);

  return { turno, diaOperacional, diaOperacionalStr: formatYMD(diaOperacional) };
}

/**
 * Janela [inicio, fim) exata de um turno dentro de um dia operacional
 * ("YYYY-MM-DD"). Útil pra filtrar alocações por sobreposição de intervalo.
 */
function getJanelaTurno(diaOperacionalStr, turno) {
  const [y, m, d] = diaOperacionalStr.split("-").map(Number);
  if (turno === "T1") return { inicio: new Date(y, m - 1, d, 6, 0, 0), fim: new Date(y, m - 1, d, 14, 0, 0) };
  if (turno === "T2") return { inicio: new Date(y, m - 1, d, 14, 0, 0), fim: new Date(y, m - 1, d, 22, 0, 0) };
  // T3: 22:00 do dia operacional até 05:59:59 do dia seguinte
  return { inicio: new Date(y, m - 1, d, 22, 0, 0), fim: new Date(y, m - 1, d + 1, 6, 0, 0) };
}

/**
 * Converte o timestamp "YYYY-MM-DD HH:mm:ss" das planilhas (já em horário
 * local de Brasília) num Date local — mesma convenção do resto do módulo,
 * sem passar por conversão de fuso.
 */
function parseDataHoraPlanilha(texto) {
  if (!texto) return null;
  const m = String(texto).trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mes, d, h, mi, s] = m;
  return new Date(Number(y), Number(mes) - 1, Number(d), Number(h), Number(mi), Number(s));
}

/** Inverso de parseDataHoraPlanilha — formata de volta "YYYY-MM-DD HH:mm:ss". */
function formatDataHora(date) {
  if (!date) return null;
  const d = new Date(date);
  const parte = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${parte(d.getMonth() + 1)}-${parte(d.getDate())} ${parte(d.getHours())}:${parte(d.getMinutes())}:${parte(d.getSeconds())}`;
}

module.exports = {
  agoraBrasil,
  getTurnoOperacionalAtual,
  getJanelaTurno,
  parseDataHoraPlanilha,
  formatDataHora,
};
