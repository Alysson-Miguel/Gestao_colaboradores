const { google } = require("googleapis");

/* =====================================================
   CONFIG
===================================================== */

const META_SPREADSHEET_ID = "17Dpmr1Kn6ybvK3rah2JvoCBsAeOvotvM6k_7uaATPz0";
const META_SHEET = "Meta";

/* =====================================================
   CACHE
===================================================== */

let sheetCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function isCacheValid() {
  return (
    sheetCache &&
    cacheTimestamp &&
    Date.now() - cacheTimestamp < CACHE_TTL
  );
}

function limparCache() {
  sheetCache = null;
  cacheTimestamp = null;
  console.log("🗑️ Cache limpo");
}

/* =====================================================
   GOOGLE CLIENT
===================================================== */

const getGoogleSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({
    version: "v4",
    auth,
    retry: false,
  });
};

/* =====================================================
   HELPERS
===================================================== */

const formatarData = (dataISO) => {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
};

const normalizar = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .trim();

/* =====================================================
   CARREGAR PLANILHA
===================================================== */

async function carregarPlanilha() {
  if (isCacheValid()) {
    console.log("📦 Meta retornada do cache");
    return sheetCache;
  }

  console.log("🌎 Buscando Meta no Google Sheets...");

  const sheets = getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: META_SPREADSHEET_ID,
    range: `${META_SHEET}!A:E`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rows = response.data.values;

  if (!rows || rows.length === 0) {
    throw new Error("Aba Meta vazia");
  }

  sheetCache = rows;
  cacheTimestamp = Date.now();

  console.log("✅ Meta armazenada em cache");

  return rows;
}

/* =====================================================
   BUSCAR METAS POR TURNO E DATA
===================================================== */

async function buscarMetasProducao(turno, dataISO) {
  try {
    console.log("🔍 Iniciando busca de metas:", { turno, dataISO });
    
    const rows = await carregarPlanilha();
    const dataBusca = formatarData(dataISO);

    console.log("� Planilha carregada:", rows.length, "linhas");
    console.log("�🔍 Buscando metas para:", { turno, data: dataBusca });

    // Estrutura esperada: Data | Hora | Esteira | Meta | Turno
    const metasPorHora = {};
    let metaDia = 0;
    let linhasEncontradas = 0;

    // Pular header (linha 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || row.length < 4) continue;

      const dataRow = normalizar(row[0]);
      const horaRaw = normalizar(row[1]);
      const hora = parseInt(horaRaw);
      const esteira = normalizar(row[2]);
      
      // Tratar números no formato brasileiro
      const metaOriginal = String(row[3] || '0').trim();
      let metaStr = metaOriginal;
      
      if (metaOriginal.includes('.') && metaOriginal.includes(',')) {
        metaStr = metaOriginal.replace(/\./g, '').replace(',', '.');
      } else if (metaOriginal.includes(',') && !metaOriginal.includes('.')) {
        const partes = metaOriginal.split(',');
        if (partes[1] && partes[1].length === 3) {
          metaStr = metaOriginal.replace(',', '');
        } else {
          metaStr = metaOriginal.replace(',', '.');
        }
      }
      
      const meta = parseFloat(metaStr) || 0;
      
      // Inferir turno pela hora se não estiver na planilha
      let turnoRow = row[4] ? normalizar(row[4]) : null;
      
      if (!turnoRow) {
        // T1: 6-13h, T2: 14-21h, T3: 22-5h
        if (hora >= 6 && hora <= 13) {
          turnoRow = 'T1';
        } else if (hora >= 14 && hora <= 21) {
          turnoRow = 'T2';
        } else {
          turnoRow = 'T3';
        }
      }

      // Debug das primeiras 10 linhas
      if (i <= 10) {
        console.log(`Linha ${i}:`, { 
          dataRow, 
          horaRaw, 
          hora, 
          esteira, 
          metaOriginal,
          metaStr,
          meta, 
          turnoRow 
        });
      }

      // Filtrar por data e turno
      if (dataRow === dataBusca && turnoRow === turno && !isNaN(hora)) {
        linhasEncontradas++;
        
        if (!metasPorHora[hora]) {
          metasPorHora[hora] = 0;
        }
        
        metasPorHora[hora] += meta;
        metaDia += meta;

        if (linhasEncontradas <= 10) {
          console.log(`✅ Match encontrado:`, { 
            hora, 
            esteira, 
            metaOriginal,
            metaStr,
            meta, 
            totalHora: metasPorHora[hora] 
          });
        }
      }
    }

    console.log("✅ Metas encontradas:", { 
      metaDia, 
      horas: Object.keys(metasPorHora).length,
      linhasEncontradas,
      metasPorHora 
    });

    if (linhasEncontradas === 0) {
      console.warn("⚠️ Nenhuma linha encontrada para:", { turno, data: dataBusca });
      console.warn("📋 Primeiras 5 linhas da planilha:");
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        console.warn(`Linha ${i}:`, rows[i]);
      }
    }

    return {
      success: true,
      data: {
        dataConsultada: dataBusca,
        turnoConsultado: turno,
        metaDia,
        metasPorHora,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao buscar metas:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
}

module.exports = {
  buscarMetasProducao,
  limparCache,
};
