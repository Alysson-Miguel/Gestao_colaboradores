const { google } = require("googleapis");

const SPREADSHEET_ID = "16s1jJEybU-NvjVWQZT6LLqbkfKJ0rX9nVg8u1sfJTA0";
const SHEET = "Calculadora";

// Colunas de Diarista por turno (0-based): C=2, D=3, E=4
const TURNO_COL = { 1: 3, 2: 4, 3: 5 };

let cache = null;
let cacheTs = null;
const CACHE_TTL = 5 * 60 * 1000;

function isCacheValid() {
  return cache && cacheTs && Date.now() - cacheTs < CACHE_TTL;
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

async function carregarCalculadora() {
  if (isCacheValid()) return cache;

  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:E`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  cache = res.data.values || [];
  cacheTs = Date.now();
  return cache;
}

/**
 * Busca a quantidade planejada de diaristas na aba Calculadora.
 * @param {string} dataISO - formato "YYYY-MM-DD"
 * @param {number} idTurno - 1, 2 ou 3
 * @returns {Promise<number>}
 */
async function buscarDwPlanejadoCalculadora(dataISO, idTurno) {
  const rows = await carregarCalculadora();

  // Converte dataISO para número serial do Excel/Sheets para comparar com UNFORMATTED_VALUE
  // Sheets retorna datas como número serial quando UNFORMATTED_VALUE
  // Alternativa: usar FORMATTED_VALUE e comparar string
  // Vamos recarregar com FORMATTED_VALUE para facilitar
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:F`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const allRows = res.data.values || [];

  // Formata a data buscada para dd/mm/yyyy
  const [ano, mes, dia] = dataISO.split("-");
  const dataBusca = `${dia}/${mes}/${ano}`;

  const col = TURNO_COL[Number(idTurno)];
  if (col === undefined) return 0;

  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || !row[1]) continue;

    if (row[1].trim() === dataBusca) {
      const val = row[col];
      return parseInt(val) || 0;
    }
  }

  return 0;
}

/**
 * Busca múltiplas quantidades planejadas de uma vez (batch).
 * @param {Array<{dataISO: string, idTurno: number}>} requests
 * @returns {Promise<Map<string, number>>} Map com chave "dataISO_idTurno" e valor quantidade
 */
async function buscarDwPlanejadoCalculadoraBatch(requests) {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:F`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const allRows = res.data.values || [];
  const resultado = new Map();

  for (const { dataISO, idTurno } of requests) {
    const [ano, mes, dia] = dataISO.split("-");
    const dataBusca = `${dia}/${mes}/${ano}`;
    const col = TURNO_COL[Number(idTurno)];

    if (col === undefined) {
      resultado.set(`${dataISO}_${idTurno}`, 0);
      continue;
    }

    let encontrado = false;
    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row || !row[1]) continue;

      if (row[1].trim() === dataBusca) {
        const val = parseInt(row[col]) || 0;
        resultado.set(`${dataISO}_${idTurno}`, val);
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      resultado.set(`${dataISO}_${idTurno}`, 0);
    }
  }

  return resultado;
}

/* ─────────────────────────────────────────────────────────
   ESTEIRAS PLANEJADAS
   Lê os headers da linha 2 dinamicamente para não depender
   de posições fixas de coluna.
───────────────────────────────────────────────────────── */
const ESTEIRAS_CONFIG = [
  { key: "esteira_a", sheetName: "Esteira A",  label: "Esteira A",            displayLabel: "🔴 Esteira A" },
  { key: "esteira_b", sheetName: "Esteira B",  label: "Esteira B",            displayLabel: "🟡 Esteira B" },
  { key: "esteira_c", sheetName: "Esteira C",  label: "Esteira C",            displayLabel: "🔵 Esteira C" },
  { key: "linear",    sheetName: "Linear",     label: "Linear",               displayLabel: "🟣 Linear" },
  { key: "termo",     sheetName: "Termoplastica", label: "Termo",              displayLabel: "🟢 Esteira Termoplástica" },
];

/**
 * Busca os operadores planejados por esteira para uma data e turno.
 * @param {string} dataISO - "YYYY-MM-DD"
 * @param {string} [turno] - "T1", "T2", "T3" ou "TODOS"/undefined (soma os 3 turnos)
 * @returns {Promise<{ date: string, belts: Array }>}
 */
async function buscarEsteirasPlanejadas(dataISO, turno) {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:Z`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const allRows = res.data.values || [];

  // Encontra dinamicamente a linha de headers (primeira que contém "Esteira")
  // A planilha repete os nomes das esteiras em 3 blocos de colunas, um por
  // turno — a linha seguinte tem os rótulos T1/T2/T3 de cada bloco. Sem parear
  // as duas linhas, só dava pra enxergar a primeira ocorrência (bloco T1).
  let headerRowIndex = -1;
  // colMap[turno][nomeEsteira] = índice da coluna
  const colMap = { T1: {}, T2: {}, T3: {} };

  for (let i = 0; i < Math.min(6, allRows.length); i++) {
    const row = allRows[i] || [];
    // Verifica somente a partir da coluna G (índice 6) conforme spec (dados em G:U)
    const temEsteira = row.slice(6).some((cell) => cell && String(cell).trim().startsWith("Esteira"));
    if (temEsteira) {
      headerRowIndex = i;
      const turnoRow = allRows[i + 1] || [];
      row.forEach((cell, idx) => {
        if (idx < 6) return;
        const nome = String(cell || "").trim().replace(/\s+/g, " ");
        const turnoDoBloco = String(turnoRow[idx] || "").trim().toUpperCase();
        if (nome && colMap[turnoDoBloco] && colMap[turnoDoBloco][nome] === undefined) {
          colMap[turnoDoBloco][nome] = idx;
        }
      });
      break;
    }
  }

  // Linhas de dados começam após headerRow + turno-labels row
  const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 2 : 3;

  // Localizar linha da data — coluna B (índice 1), formato dd/mm/yyyy
  const [ano, mes, dia] = dataISO.split("-");
  const dataBusca = `${dia}/${mes}/${ano}`;

  let dataRow = null;
  for (let i = dataStartIndex; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || !row[1]) continue;
    if (row[1].toString().trim() === dataBusca) {
      dataRow = row;
      break;
    }
  }

  // Turno específico soma só o bloco dele; "TODOS"/ausente soma os 3 blocos
  // — mesma convenção já usada nos outros KPIs do Dashboard Operacional.
  const turnosASomar = ["T1", "T2", "T3"].includes(turno) ? [turno] : ["T1", "T2", "T3"];

  const belts = ESTEIRAS_CONFIG.map(({ key, sheetName, label, displayLabel }) => {
    const plannedOperators = dataRow
      ? turnosASomar.reduce((soma, t) => {
          const colIdx = colMap[t][sheetName];
          return soma + (colIdx !== undefined ? parseInt(dataRow[colIdx]) || 0 : 0);
        }, 0)
      : 0;
    return { key, label, displayLabel, plannedOperators };
  });

  return { date: dataISO, turno: turno || "TODOS", belts };
}

module.exports = {
  buscarDwPlanejadoCalculadora,
  buscarDwPlanejadoCalculadoraBatch,
  buscarEsteirasPlanejadas,
};
