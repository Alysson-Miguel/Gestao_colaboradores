// Turno e dia operacional específicos do Mapa Operacional (Label) — limites
// exatos definidos pelo usuário, sem as tolerâncias do getDateOperacional()
// genérico da empresa (backend/src/utils/dateOperacional.js), que serve a
// outras telas com regras próprias.
//
// T1: 06:00–13:59 | T2: 14:00–21:59 | T3: 22:00–05:59 (vira o dia: o T3 que
// começa às 22:00 de um dia operacional D só termina às 05:59 de D+1, então
// pertence sempre ao dia operacional D, não ao dia seguinte do calendário).
//
// FUSO: todos os horários daqui são de Brasília (America/Sao_Paulo), qualquer que seja o fuso do
// servidor. Em servidor UTC (ex.: Render) usar new Date(ano, mês, dia, hora) ou getHours() desloca
// tudo 3 horas, então toda conversão passa por partesSP()/instanteSP().

const FUSO = "America/Sao_Paulo";

const formatadorSP = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Componentes do horário de Brasília de um instante real: { ano, mes (1-12), dia, hora, minuto, segundo }. */
function partesSP(instante = new Date()) {
  const p = {};
  formatadorSP.formatToParts(new Date(instante)).forEach(({ type, value }) => {
    p[type] = Number(value);
  });
  return { ano: p.year, mes: p.month, dia: p.day, hora: p.hour, minuto: p.minute, segundo: p.second };
}

/**
 * Instante real correspondente a um horário de parede de Brasília. Aceita dia/mês fora do intervalo
 * (ex.: dia 32) e normaliza como o Date.UTC.
 */
function instanteSP(ano, mes, dia, hora = 0, minuto = 0, segundo = 0) {
  const alvoComoUTC = Date.UTC(ano, mes - 1, dia, hora, minuto, segundo);
  let instante = alvoComoUTC;
  // Duas passadas cobrem qualquer deslocamento (inclusive horário de verão, se um dia voltar).
  for (let i = 0; i < 2; i += 1) {
    const p = partesSP(new Date(instante));
    const noFuso = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
    instante += alvoComoUTC - noFuso;
  }
  return new Date(instante);
}

/**
 * Date cujos getters LOCAIS (getHours etc.) mostram o horário de Brasília. Só serve para ler a hora;
 * para comparar ou gravar instantes use partesSP()/instanteSP().
 */
function agoraBrasil() {
  const p = partesSP();
  return new Date(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
}

const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (ano, mes, dia) => `${ano}-${pad2(mes)}-${pad2(dia)}`;

function turnoDaHora(hora) {
  if (hora >= 6 && hora < 14) return "T1";
  if (hora >= 14 && hora < 22) return "T2";
  return "T3";
}

/**
 * Turno atual + dia operacional, a partir de um instante real (default: agora). Dia operacional =
 * data corrente em Brasília, exceto no T3 antes das 06:00, quando ainda pertence ao dia anterior.
 * `diaOperacional` é a data (meia-noite local) pensada para colunas DATE do banco.
 */
function getTurnoOperacionalAtual(baseDate = new Date()) {
  const p = partesSP(baseDate);
  const turno = turnoDaHora(p.hora);
  const recuo = turno === "T3" && p.hora < 6 ? 1 : 0;
  const dia = new Date(Date.UTC(p.ano, p.mes - 1, p.dia - recuo));
  const [y, m, d] = [dia.getUTCFullYear(), dia.getUTCMonth() + 1, dia.getUTCDate()];
  return { turno, diaOperacional: new Date(y, m - 1, d), diaOperacionalStr: ymd(y, m, d) };
}

/**
 * Janela [inicio, fim) exata de um turno dentro de um dia operacional ("YYYY-MM-DD"), em instantes
 * reais. Útil pra filtrar alocações por sobreposição de intervalo.
 */
function getJanelaTurno(diaOperacionalStr, turno) {
  const [y, m, d] = diaOperacionalStr.split("-").map(Number);
  if (turno === "T1") return { inicio: instanteSP(y, m, d, 6), fim: instanteSP(y, m, d, 14) };
  if (turno === "T2") return { inicio: instanteSP(y, m, d, 14), fim: instanteSP(y, m, d, 22) };
  // T3: 22:00 do dia operacional até 05:59:59 do dia seguinte
  return { inicio: instanteSP(y, m, d, 22), fim: instanteSP(y, m, d + 1, 6) };
}

/** 06:00 (Brasília) do dia operacional, dado o `diaOperacional` devolvido por getTurnoOperacionalAtual. */
function inicioDoDiaOperacional(diaOperacional) {
  return instanteSP(diaOperacional.getFullYear(), diaOperacional.getMonth() + 1, diaOperacional.getDate(), 6);
}

/** 06:00 (Brasília) do dia seguinte: quando o dia operacional dado termina. */
function fimDoDiaOperacional(diaOperacional) {
  return instanteSP(diaOperacional.getFullYear(), diaOperacional.getMonth() + 1, diaOperacional.getDate() + 1, 6);
}

/**
 * Converte o timestamp "YYYY-MM-DD HH:mm:ss" das planilhas (horário de Brasília) no instante real.
 */
function parseDataHoraPlanilha(texto) {
  if (!texto) return null;
  const m = String(texto).trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mes, d, h, mi, s] = m;
  return instanteSP(Number(y), Number(mes), Number(d), Number(h), Number(mi), Number(s));
}

/** Inverso de parseDataHoraPlanilha — formata o instante em Brasília como "YYYY-MM-DD HH:mm:ss". */
function formatDataHora(date) {
  if (!date) return null;
  const p = partesSP(date);
  return `${ymd(p.ano, p.mes, p.dia)} ${pad2(p.hora)}:${pad2(p.minuto)}:${pad2(p.segundo)}`;
}

module.exports = {
  FUSO,
  partesSP,
  instanteSP,
  agoraBrasil,
  getTurnoOperacionalAtual,
  getJanelaTurno,
  inicioDoDiaOperacional,
  fimDoDiaOperacional,
  parseDataHoraPlanilha,
  formatDataHora,
};
