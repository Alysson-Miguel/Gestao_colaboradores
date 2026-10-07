const { google } = require("googleapis");
const { instanteSP } = require("../../utils/turnoMapaOperacional");

/* =====================================================
   Leitura ao vivo da aba "Productivity Workstation" (mesma
   planilha de Workstation) — "Total Throughput" é um contador
   cumulativo POR ESTAÇÃO FÍSICA (não por operador), o que o torna
   a base certa pra medir produção do turno: não se perde nada
   quando um operador troca ou sai da estação no meio do caminho,
   porque o contador pertence ao código, não à pessoa.
   Não sabemos (nem precisamos saber) quando esse contador reseta —
   o módulo sempre captura um "baseline" no início do turno e usa a
   diferença (atual - baseline), então funciona não importa a partir
   de que ponto a planilha conta.
===================================================== */

const WORKSTATION_SPREADSHEET_ID = "1T3zq6DtiF--pZjeYFzSo9i-EDEBXIN0yx8VcxsMcXZY";
const SHEET_PRODUCTIVITY_WORKSTATION = "Productivity Workstation";
const CACHE_TTL = 20 * 1000;

let cache = null;
let cacheTs = null;

function isCacheValid() {
  return cache && cacheTs && Date.now() - cacheTs < CACHE_TTL;
}

function limparCache() {
  cache = null;
  cacheTs = null;
}

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

function parseBracketed(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^\[(.*?)\]\s*(.*)$/);
  if (!match) return text;
  return match[2] || text;
}

function parseNumero(texto) {
  return Number(String(texto ?? "0").replace(/\./g, "").replace(",", ".")) || 0;
}

/**
 * Lê a aba e devolve um Map código-da-estação -> total throughput atual.
 * Colunas: Workstation ID/Name, Workstation Group, Working Hours,
 * Activity Type, Manpower, %Dedicated, %Freelancer, Hourly Productivity,
 * Total Throughput (orders), ...
 */
async function getThroughputPorEstacao() {
  if (isCacheValid()) return cache;

  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: WORKSTATION_SPREADSHEET_ID,
    range: `${SHEET_PRODUCTIVITY_WORKSTATION}!A:L`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  const mapa = new Map();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const codigo = parseBracketed(row[0]);
    if (!codigo) continue;
    mapa.set(codigo, parseNumero(row[8]));
  }

  // Carimbo "Atualizado: DD/MM/YYYY HH:mm:ss" no cabeçalho — diz de quando é o
  // dado (o contador zera às 06:00 e logo depois ainda pode vir do dia anterior).
  const carimbo = String((rows[0] || []).find((c) => /^Atualizado:/i.test(String(c || ""))) || "");
  const m = carimbo.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  mapa.atualizadoEm = m ? instanteSP(Number(m[3]), Number(m[2]), Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6])) : null;

  cache = mapa;
  cacheTs = Date.now();
  return mapa;
}

module.exports = { getThroughputPorEstacao, limparCache };
