const { google } = require("googleapis");

/* =====================================================
   Leitura ao vivo da aba "Productivity" (mesma planilha de
   Workstation) — produtividade por operador em janela rolante
   (colunas "HH:00" regressivas a partir da hora atual).
===================================================== */

const WORKSTATION_SPREADSHEET_ID = "1T3zq6DtiF--pZjeYFzSo9i-EDEBXIN0yx8VcxsMcXZY";
const SHEET_PRODUCTIVITY = "Productivity";
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
  if (!match) return { codigo: null, resto: text };
  return { codigo: match[1], resto: match[2] };
}

function normalizeOpsId(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Lê a aba Productivity e devolve um Map opsId-normalizado -> registro.
 * As colunas de hora já vêm rotuladas com o horário real ("05:00",
 * "04:00"...), diferente da planilha ProdutividadeSPX (que exige casar
 * a coluna certa por posição) — aqui basta ler o cabeçalho literalmente.
 */
async function getProdutividadePorOperador_() {
  if (isCacheValid()) return cache;

  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: WORKSTATION_SPREADSHEET_ID,
    range: `${SHEET_PRODUCTIVITY}!A:Z`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  const mapa = new Map();

  if (rows.length > 0) {
    const header = rows[0];
    const colunasHora = [];
    for (let c = 2; c < header.length; c++) {
      const texto = String(header[c] || "").trim();
      const m = texto.match(/^(\d{1,2}):00$/);
      if (m) colunasHora.push({ index: c, hora: Number(m[1]) });
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const operador = parseBracketed(row[0]);
      if (!operador.codigo) continue;

      const porHora = {};
      colunasHora.forEach((col) => {
        porHora[col.hora] = Number(String(row[col.index] || "0").replace(",", ".")) || 0;
      });

      mapa.set(normalizeOpsId(operador.codigo), {
        opsId: operador.codigo,
        nome: operador.resto || null,
        efficiencyTotal: Number(String(row[1] || "0").replace(",", ".")) || 0,
        porHora,
      });
    }
  }

  cache = mapa;
  cacheTs = Date.now();
  return mapa;
}

/**
 * Produtividade de um operador na hora atual (America/Sao_Paulo).
 * Retorna 0 quando o operador não aparece na planilha (sem dado ainda).
 */
async function getProdutividadeHoraAtual(opsId, horaAtual) {
  const mapa = await getProdutividadePorOperador_();
  const registro = mapa.get(normalizeOpsId(opsId));
  if (!registro) return { encontrado: false, producaoHoraAtual: 0, efficiencyTotal: 0 };
  return {
    encontrado: true,
    producaoHoraAtual: registro.porHora[horaAtual] || 0,
    efficiencyTotal: registro.efficiencyTotal,
  };
}

module.exports = {
  getProdutividadePorOperador_,
  getProdutividadeHoraAtual,
  limparCache,
};
