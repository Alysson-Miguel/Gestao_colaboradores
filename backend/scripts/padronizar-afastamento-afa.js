/**
 * Padroniza o afastamento automático em AFA (id do tipo "AFA", que a tela reconhece).
 * O preenchimento antigo gravava o tipo "AF", desenhado na tela como Falta (F).
 *
 *  - frequencia: AF + justificativa AUTO_AFASTAMENTO  ->  AFA
 *  - ausencia:   AF duplicada de uma AFA já existente (mesmo colaborador e início) é removida;
 *                AF sem equivalente passa a AFA
 *  - Não mexe em AF com outra justificativa (ex.: FALTA_INJUSTIFICADA) — só lista.
 *
 * Uso: node scripts/padronizar-afastamento-afa.js           (dry-run)
 *      node scripts/padronizar-afastamento-afa.js --apply   (grava, em uma transação)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

(async () => {
  const [afa, af] = await Promise.all([
    prisma.tipoAusencia.findFirst({ where: { codigo: "AFA" }, select: { idTipoAusencia: true } }),
    prisma.tipoAusencia.findFirst({ where: { codigo: "AF" }, select: { idTipoAusencia: true } }),
  ]);
  if (!afa || !af) throw new Error("Tipos AFA/AF não encontrados");

  const freqAlvo = { idTipoAusencia: af.idTipoAusencia, justificativa: "AUTO_AFASTAMENTO" };
  const [qtdFreq, colaboradores, outras, ausencias] = await Promise.all([
    prisma.frequencia.count({ where: freqAlvo }),
    prisma.frequencia.groupBy({ by: ["opsId"], where: freqAlvo }),
    prisma.frequencia.findMany({
      where: { idTipoAusencia: af.idTipoAusencia, NOT: { justificativa: "AUTO_AFASTAMENTO" } },
      select: { opsId: true, dataReferencia: true, justificativa: true },
    }),
    prisma.ausencia.findMany({ where: { idTipoAusencia: af.idTipoAusencia }, select: { idAusencia: true, opsId: true, dataInicio: true } }),
  ]);

  const duplicadas = [];
  const converter = [];
  for (const a of ausencias) {
    const equivalente = await prisma.ausencia.count({ where: { opsId: a.opsId, idTipoAusencia: afa.idTipoAusencia, dataInicio: a.dataInicio } });
    (equivalente ? duplicadas : converter).push(a.idAusencia);
  }

  console.log(`frequência AF -> AFA: ${qtdFreq} registros de ${colaboradores.length} colaborador(es)`);
  console.log(`ausência AF: ${ausencias.length} (duplicadas a remover: ${duplicadas.length} | a converter: ${converter.length})`);
  console.log("AF com outra justificativa (não alterados):", outras.map((o) => `${o.opsId} ${o.dataReferencia.toISOString().slice(0, 10)} ${o.justificativa}`));

  if (!APPLY) { console.log("dry-run: nada gravado. Use --apply."); await prisma.$disconnect(); return; }

  await prisma.$transaction(async (tx) => {
    await tx.frequencia.updateMany({ where: freqAlvo, data: { idTipoAusencia: afa.idTipoAusencia } });
    if (duplicadas.length) await tx.ausencia.deleteMany({ where: { idAusencia: { in: duplicadas } } });
    if (converter.length) await tx.ausencia.updateMany({ where: { idAusencia: { in: converter } }, data: { idTipoAusencia: afa.idTipoAusencia } });
  }, { timeout: 120000 });

  const [restaFreq, restaAus, totalAfa] = await Promise.all([
    prisma.frequencia.count({ where: freqAlvo }),
    prisma.ausencia.count({ where: { idTipoAusencia: af.idTipoAusencia } }),
    prisma.frequencia.count({ where: { idTipoAusencia: afa.idTipoAusencia } }),
  ]);
  console.log(`concluído | AF AUTO_AFASTAMENTO restantes: ${restaFreq} | ausências AF restantes: ${restaAus} | total de registros AFA agora: ${totalAfa}`);
  await prisma.$disconnect();
})().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
