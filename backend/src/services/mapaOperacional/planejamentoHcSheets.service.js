const { google } = require("googleapis");

/* =====================================================
   HC planejado por dia/turno/área — aba "Calculadora" da planilha de
   planejamento. Colunas A:B = semana/data; de G até AA há 3 blocos de 7
   colunas (T1, T2, T3), cada um com INbound, Esteira A/B/C, Linear,
   Termoplastica e OUTbound. As colunas são localizadas pelos cabeçalhos
   (linha 1 = área, linha 2 = turno), não por posição fixa, pra não quebrar
   se a planilha ganhar/perder colunas. A partir da AB são outros indicadores
   (HC Fixo Plan etc.) e ficam de fora.
===================================================== */

const PLANEJAMENTO_SPREADSHEET_ID = "16s1jJEybU-NvjVWQZT6LLqbkfKJ0rX9nVg8u1sfJTA0";
const SHEET_CALCULADORA = "Calculadora";
const CACHE_TTL = 60 * 1000;
const COL_PRIMEIRA = 6; // G
const COL_ULTIMA = 26; // AA

const AREAS_POR_ROTULO = {
  inbound: "INBOUND",
  "esteira a": "ESTEIRA_A",
  "esteira b": "ESTEIRA_B",
  "esteira c": "ESTEIRA_C",
  linear: "LINEAR",
  termoplastica: "TERMOPLASTICA",
  outbound: "OUTBOUND",
};

let cache = null;
let cacheTs = null;

function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth, retry: false });
}

function normaliza(texto) {
  return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function parseNumero(valor) {
  const n = Number(String(valor ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** "DD/MM/YYYY" -> "YYYY-MM-DD" (ou null). */
function dataParaIso(texto) {
  const m = String(texto || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

async function carregar_() {
  if (cache && cacheTs && Date.now() - cacheTs < CACHE_TTL) return cache;

  const res = await getClient().spreadsheets.values.get({
    spreadsheetId: PLANEJAMENTO_SPREADSHEET_ID,
    range: `${SHEET_CALCULADORA}!A:AA`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  const rows = res.data.values || [];
  const rotulos = rows[0] || [];
  const turnos = rows[1] || [];

  const colunas = [];
  for (let c = COL_PRIMEIRA; c <= COL_ULTIMA; c++) {
    const area = AREAS_POR_ROTULO[normaliza(rotulos[c])];
    const turno = String(turnos[c] || "").trim().toUpperCase();
    if (area && ["T1", "T2", "T3"].includes(turno)) colunas.push({ c, area, turno });
  }

  const porData = new Map();
  for (let r = 2; r < rows.length; r++) {
    const iso = dataParaIso(rows[r][1]);
    if (!iso) continue;
    const dia = { T1: {}, T2: {}, T3: {} };
    colunas.forEach(({ c, area, turno }) => {
      dia[turno][area] = parseNumero(rows[r][c]);
    });
    porData.set(iso, dia);
  }

  cache = { porData, colunasLidas: colunas.length };
  cacheTs = Date.now();
  return cache;
}

/**
 * HC planejado de um dia operacional ("YYYY-MM-DD") por turno e área, ou null
 * quando a data não existe na planilha.
 */
async function getPlanejamentoHc(diaOperacionalStr) {
  const { porData } = await carregar_();
  return porData.get(diaOperacionalStr) || null;
}

module.exports = { getPlanejamentoHc };
