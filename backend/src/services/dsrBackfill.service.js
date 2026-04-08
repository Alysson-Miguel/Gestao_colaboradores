const { prisma } = require("../config/database");

function agoraBrasil() {
  const now = new Date();
  const spString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(spString);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Busca os dias de DSR de uma escala pelo nome.
 * Prioriza o campo diasDsr do banco; faz fallback para o mapa legado (E/G/C)
 * caso o campo ainda esteja vazio (escalas antigas antes da migration).
 */
async function getDiasDsr(nomeEscala, tx = prisma) {
  if (!nomeEscala) return [];

  const escala = await tx.escala.findFirst({
    where: { nomeEscala: { equals: nomeEscala, mode: "insensitive" } },
    select: { diasDsr: true },
  });

  // diasDsr preenchido no banco → usa
  if (escala?.diasDsr?.length) return escala.diasDsr;

  // fallback legado para escalas E/G/C sem diasDsr gravado ainda
  const legado = { E: [0, 1], G: [2, 3], C: [4, 5] };
  return legado[String(nomeEscala).toUpperCase()] ?? [];
}

async function gerarDSRBackfillColaborador({ opsId, nomeEscala, dataInicio, tx = prisma }) {
  if (!opsId) throw new Error("opsId é obrigatório.");
  if (!nomeEscala) return { criados: 0 };

  const diasDsr = await getDiasDsr(nomeEscala, tx);
  if (!diasDsr.length) return { criados: 0 };

  const tipoDSR = await tx.tipoAusencia.findFirst({
    where: { codigo: "DSR" },
    select: { idTipoAusencia: true },
  });
  if (!tipoDSR) throw new Error("Tipo de ausência DSR não encontrado.");

  const inicio = startOfDay(dataInicio || agoraBrasil());
  const hoje   = startOfDay(agoraBrasil());

  if (inicio > hoje) return { criados: 0 };

  const registros = [];
  for (let data = new Date(inicio); data <= hoje; data.setDate(data.getDate() + 1)) {
    const dataRef = startOfDay(new Date(data));
    if (!diasDsr.includes(dataRef.getDay())) continue;
    registros.push({
      opsId,
      dataReferencia: dataRef,
      idTipoAusencia: tipoDSR.idTipoAusencia,
      justificativa: "DSR_BACKFILL",
      manual: false,
      validado: true,
    });
  }

  if (!registros.length) return { criados: 0 };

  const resultado = await tx.frequencia.createMany({ data: registros, skipDuplicates: true });
  return { criados: resultado.count || 0 };
}

async function gerarDSRFuturoColaborador({ opsId, nomeEscala, tx = prisma, dias = 90 }) {
  if (!nomeEscala) return;

  const diasDsr = await getDiasDsr(nomeEscala, tx);
  if (!diasDsr.length) return;

  const tipoDSR = await tx.tipoAusencia.findFirst({
    where: { codigo: "DSR" },
    select: { idTipoAusencia: true },
  });
  if (!tipoDSR) return;

  const hoje = startOfDay(agoraBrasil());
  const registros = [];

  for (let i = 1; i <= dias; i++) {
    const data = new Date(hoje);
    data.setDate(data.getDate() + i);
    if (!diasDsr.includes(data.getDay())) continue;
    registros.push({
      opsId,
      dataReferencia: data,
      idTipoAusencia: tipoDSR.idTipoAusencia,
      justificativa: "DSR_AUTO",
      manual: false,
      validado: true,
    });
  }

  if (registros.length) {
    await tx.frequencia.createMany({ data: registros, skipDuplicates: true });
  }
}

/**
 * Gera os 2 dias de Onboarding (ON) para um colaborador:
 * data_admissao e data_admissao + 1 dia.
 */
async function gerarOnboardingColaborador({ opsId, dataAdmissao, tx = prisma }) {
  if (!opsId) throw new Error("opsId é obrigatório.");
  if (!dataAdmissao) throw new Error("dataAdmissao é obrigatória.");

  const tipoON = await tx.tipoAusencia.findFirst({
    where: { codigo: "ON" },
    select: { idTipoAusencia: true },
  });
  if (!tipoON) throw new Error("Tipo de ausência ON não encontrado.");

  const dia1 = startOfDay(new Date(dataAdmissao));
  const dia2 = new Date(dia1);
  dia2.setDate(dia2.getDate() + 1);

  for (const dia of [dia1, dia2]) {
    await tx.frequencia.upsert({
      where: { opsId_dataReferencia: { opsId, dataReferencia: dia } },
      update: { idTipoAusencia: tipoON.idTipoAusencia, manual: false, registradoPor: "SISTEMA_AUTO" },
      create: { opsId, dataReferencia: dia, idTipoAusencia: tipoON.idTipoAusencia, manual: false, registradoPor: "SISTEMA_AUTO" },
    });
  }
}

module.exports = {
  gerarDSRBackfillColaborador,
  gerarDSRFuturoColaborador,
  gerarOnboardingColaborador,
};
