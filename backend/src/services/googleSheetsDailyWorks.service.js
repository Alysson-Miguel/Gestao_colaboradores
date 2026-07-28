const { google } = require("googleapis");
const { buscarDwLista } = require("./dwLista.service");

/* =====================================================
   CONFIGURAÇÕES DA ABA DE DAILY WORKS
   Reaproveita a mesma planilha já usada para Colaboradores
   (já compartilhada com a conta de serviço), só numa aba nova.
===================================================== */
const SPREADSHEET_ID =
  process.env.SHEETS_COLABORADORES_SPREADSHEET_ID ||
  "1KV1aZh5k2moYIaUQRWPguf1hjB2nJT44sybzkk0Ki7U";
const DW_SHEET = process.env.SHEETS_DAILY_WORKS_ABA || "daily_works";
const ESTACAO_DAILY_WORKS = 1; // SoC_PE_Jabotao_dos_Guararapes
// Início do histórico — nunca "roda" com a virada do mês, mantém tudo desde essa data
const DATA_INICIO_HISTORICO = process.env.SHEETS_DAILY_WORKS_INICIO || "2026-07-01";

const EMPRESAS_FIXAS = ["SRM", "Fenix", "Horeca", "Diarias TECH"];

const getGoogleSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
};

/** Garante que a aba exista na planilha, criando se necessário. */
async function garantirAbaExiste(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existe = meta.data.sheets?.some((s) => s.properties?.title === DW_SHEET);

  if (!existe) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{ addSheet: { properties: { title: DW_SHEET } } }],
      },
    });
    console.log(`📄 Aba "${DW_SHEET}" criada na planilha`);
  }
}

/* =====================================================
   EXPORTAR DAILY WORKS DO DIA PARA O GOOGLE SHEETS
   Mesmas colunas do botão "Exportar CSV" da tela Daily Works.
===================================================== */
const exportarDailyWorks = async () => {
  console.log("\n📊 ===== EXPORTAR DAILY WORKS =====");

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // YYYY-MM-DD

  const listaBruta = await buscarDwLista({
    dataInicio: DATA_INICIO_HISTORICO,
    dataFim: hoje,
    idEstacao: ESTACAO_DAILY_WORKS,
  });

  // Histórico completo do mais antigo para o mais recente (mais fácil de ler na planilha)
  const lista = [...listaBruta].sort((a, b) =>
    a.data === b.data ? a.idTurno - b.idTurno : a.data.localeCompare(b.data)
  );

  console.log(`📅 Período: ${DATA_INICIO_HISTORICO} → ${hoje} — ${lista.length} linha(s)`);

  const headers = [
    "Data",
    ...EMPRESAS_FIXAS,
    "Total Planejado",
    "Total Real",
    "% Aderência",
    "Turno",
  ];

  const rows = lista.map((row) => {
    const planejado = row.planejado || 0;
    const real = row.totalReal || 0;
    const aderencia = planejado > 0 ? `${((real / planejado) * 100).toFixed(1)}%` : "-";

    return [
      row.data,
      ...EMPRESAS_FIXAS.map((emp) => row.empresas?.[emp] ?? 0),
      planejado,
      real,
      aderencia,
      row.turno,
    ];
  });

  const values = [headers, ...rows];

  const sheets = getGoogleSheetsClient();
  await garantirAbaExiste(sheets);

  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: DW_SHEET,
    });
  } catch (clearError) {
    console.warn("⚠️ Erro ao limpar aba (continuando):", clearError.message);
  }

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${DW_SHEET}!A1`,
    valueInputOption: "RAW",
    resource: { values },
  });

  const horaAtualizacao = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${DW_SHEET}!K1`,
    valueInputOption: "RAW",
    resource: { values: [[`Última atualização: ${horaAtualizacao}`]] },
  });

  console.log(`🕐 Hora de atualização registrada: ${horaAtualizacao}`);
  console.log(`✅ Exportação concluída: ${response.data.updatedCells} células atualizadas`);
  console.log("=================================\n");

  return {
    success: true,
    data: {
      totalLinhas: lista.length,
      celulasAtualizadas: response.data.updatedCells,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
    },
  };
};

module.exports = { exportarDailyWorks };
