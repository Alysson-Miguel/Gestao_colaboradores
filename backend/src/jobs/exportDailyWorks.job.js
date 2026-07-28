const cron = require("node-cron");
const { exportarDailyWorks } = require("../services/googleSheetsDailyWorks.service");
const logger = require("../utils/logger");

async function executarExportDailyWorks() {
  try {
    const resultado = await exportarDailyWorks();
    logger.info(`✅ [DAILY-WORKS-EXPORT] Concluído — ${JSON.stringify(resultado.data)}`);
  } catch (err) {
    logger.error(`❌ [DAILY-WORKS-EXPORT] Erro: ${err.message}`);
  }
}

/**
 * Job: exporta o Daily Works do dia para o Google Sheets.
 * Roda 3x ao dia — 08:00, 15:00 e 23:00 (horário de Brasília).
 */
function iniciarJobExportDailyWorks() {
  cron.schedule("0 8,15,23 * * *", executarExportDailyWorks, {
    timezone: "America/Sao_Paulo",
  });

  logger.info("📊 [DAILY-WORKS-EXPORT] Job agendado (08:00, 15:00 e 23:00).");
}

module.exports = { iniciarJobExportDailyWorks, executarExportDailyWorks };
