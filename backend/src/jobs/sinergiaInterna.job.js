const cron = require("node-cron");
const { processarVencimentos } = require("../services/sinergiaInterna/sinergiaInterna.service");

/**
 * Rotina da Sinergia Interna (a cada minuto):
 *  - sinergia ativa que chegou ao fim previsto sem prorrogação -> AGUARDANDO_RETORNO
 *    (o fim do turno NUNCA marca o colaborador como retornado: só o QR de retorno faz isso);
 *  - solicitada / em deslocamento que passou do período previsto -> EXPIRADA.
 */
function iniciarJobSinergiaInterna() {
  async function executar() {
    try {
      const r = await processarVencimentos();
      if (r.aguardandoRetorno > 0 || r.expiradas > 0) {
        console.log(`🔁 [SINERGIA-INTERNA] ${r.aguardandoRetorno} aguardando retorno, ${r.expiradas} expiradas`);
      }
    } catch (err) {
      console.error("❌ [SINERGIA-INTERNA] Erro ao processar vencimentos:", err.message);
    }
  }

  executar();
  cron.schedule("*/1 * * * *", executar);
  console.log("✅ [SINERGIA-INTERNA] Job de vencimentos agendado (a cada 1 minuto)");
}

module.exports = { iniciarJobSinergiaInterna };
