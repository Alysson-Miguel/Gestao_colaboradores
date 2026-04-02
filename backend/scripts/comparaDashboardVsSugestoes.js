const { prisma } = require('../src/config/database');

const CARGOS_OPERACIONAIS = [
  'Auxiliar de Logística I',
  'Auxiliar de Logística II',
  'Auxiliar de Logística I - PCD',
  'Auxiliar de Returns I',
  'Auxilíar de Returns II',
  'Fiscal de pátio',
];

async function main() {
  const inicio = new Date('2026-03-31T00:00:00');
  const fim    = new Date('2026-04-01T23:59:59');

  // 1. Todas as frequências F no período (o que o dashboard vê)
  const faltas = await prisma.frequencia.findMany({
    where: {
      tipoAusencia: { codigo: 'F' },
      dataReferencia: { gte: inicio, lte: fim },
    },
    include: {
      colaborador: {
        select: {
          opsId: true,
          nomeCompleto: true,
          status: true,
          dataDesligamento: true,
          cargo: { select: { nomeCargo: true } },
        },
      },
      tipoAusencia: { select: { codigo: true } },
    },
    orderBy: { dataReferencia: 'asc' },
  });

  // 2. Sugestões criadas no mesmo período
  const sugestoes = await prisma.sugestaoMedidaDisciplinar.findMany({
    where: {
      dataReferencia: { gte: inicio, lte: fim },
    },
    select: { opsId: true, status: true, dataReferencia: true },
  });

  const sugestoesPorOps = {};
  for (const s of sugestoes) {
    const key = `${s.opsId}_${s.dataReferencia.toISOString().slice(0,10)}`;
    sugestoesPorOps[key] = s.status;
  }

  console.log(`\n=== FALTAS (F) no período 31/03 → 01/04 ===\n`);
  console.log(`Total frequências F: ${faltas.length}\n`);

  for (const f of faltas) {
    const data = f.dataReferencia.toISOString().slice(0,10);
    const key  = `${f.opsId}_${data}`;
    const sugestao = sugestoesPorOps[key] ?? 'SEM SUGESTÃO';
    const cargo = f.colaborador?.cargo?.nomeCargo ?? 'sem cargo';
    const status = f.colaborador?.status ?? '?';
    const operacional = CARGOS_OPERACIONAIS.includes(cargo);

    console.log(`${f.colaborador?.nomeCompleto ?? f.opsId}`);
    console.log(`  Data: ${data} | Cargo: ${cargo} | Status colaborador: ${status} | Operacional: ${operacional ? 'SIM' : 'NÃO'}`);
    console.log(`  Sugestão MD: ${sugestao}`);
    console.log('');
  }

  console.log(`Total sugestões no período: ${sugestoes.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
