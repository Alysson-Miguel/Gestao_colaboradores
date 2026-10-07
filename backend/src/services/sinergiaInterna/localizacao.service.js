const { prisma } = require("../../config/database");
const { STATUS_NO_DESTINO } = require("./base");

/* =====================================================
   Localização operacional
   - com sinergia confirmada no destino (ATIVA ou AGUARDANDO_RETORNO): é o destino;
   - senão: o setor base (nada muda). A Label consulta isto pra decidir onde a
     pessoa pode ser alocada. O setor base do cadastro NUNCA é alterado.
===================================================== */

const INCLUDE_AREAS = {
  areaOrigem: { select: { idArea: true, codigo: true, nome: true, contexto: true } },
  areaDestino: { select: { idArea: true, codigo: true, nome: true, contexto: true } },
};

/** Map opsId -> sinergia em andamento no destino (somente quem de fato já chegou). */
async function sinergiasNoDestino(opsIds) {
  if (!opsIds.length) return new Map();
  const linhas = await prisma.sinergiaInterna.findMany({
    where: { opsId: { in: opsIds }, status: { in: STATUS_NO_DESTINO } },
    select: { idSinergia: true, opsId: true, status: true, dataChegada: true, funcaoDestino: true, ...INCLUDE_AREAS },
  });
  return new Map(linhas.map((l) => [l.opsId, l]));
}

async function sinergiaNoDestinoDe(opsId) {
  return (await sinergiasNoDestino([opsId])).get(opsId) || null;
}

module.exports = { sinergiasNoDestino, sinergiaNoDestinoDe };
