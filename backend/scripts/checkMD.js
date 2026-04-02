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
  // 1. Buscar todas as frequências com código F de colaboradores operacionais ativos
  const faltas = await prisma.frequencia.findMany({
    where: {
      tipoAusencia: { codigo: 'F' },
      colaborador: {
        status: 'ATIVO',
        dataDesligamento: null,
        cargo: { nomeCargo: { in: CARGOS_OPERACIONAIS } },
      },
    },
    include: {
      colaborador: {
        select: {
          opsId: true,
          nomeCompleto: true,
          matricula: true,
          cargo: { select: { nomeCargo: true } },
        },
      },
    },
    orderBy: { dataReferencia: 'desc' },
  });

  // 2. Buscar MDs existentes (não canceladas) via raw para evitar problema de enum desatualizado
  const mds = await prisma.$queryRaw`
    SELECT ops_id as "opsId", status::text, origem
    FROM medida_disciplinar
    WHERE violacao = 'FALTA_INJUSTIFICADA'
      AND status::text <> 'CANCELADA'
  `;

  const mdPorOps = {};
  for (const md of mds) {
    if (!mdPorOps[md.opsId]) mdPorOps[md.opsId] = [];
    mdPorOps[md.opsId].push(md);
  }

  // 3. Buscar sugestões já existentes
  const sugestoes = await prisma.sugestaoMedidaDisciplinar.findMany({
    select: { opsId: true, status: true, dataReferencia: true },
  });

  const sugestoesPorOps = {};
  for (const s of sugestoes) {
    if (!sugestoesPorOps[s.opsId]) sugestoesPorOps[s.opsId] = [];
    sugestoesPorOps[s.opsId].push(s);
  }

  // 4. Agrupar faltas por colaborador
  const porColab = {};
  for (const f of faltas) {
    const id = f.opsId;
    if (!porColab[id]) {
      porColab[id] = {
        opsId: f.colaborador.opsId,
        nome: f.colaborador.nomeCompleto,
        matricula: f.colaborador.matricula,
        cargo: f.colaborador.cargo?.nomeCargo,
        qtdFaltas: 0,
        datas: [],
      };
    }
    porColab[id].qtdFaltas++;
    porColab[id].datas.push(f.dataReferencia.toISOString().slice(0, 10));
  }

  const lista = Object.values(porColab).sort((a, b) => b.qtdFaltas - a.qtdFaltas);

  console.log('\n=== COLABORADORES COM FALTA INJUSTIFICADA (F) — OPERACIONAIS ATIVOS ===\n');
  for (const c of lista) {
    const mdsDoColab = mdPorOps[c.opsId] || [];
    const sugestoesDoColab = sugestoesPorOps[c.opsId] || [];
    const reincidente = mdsDoColab.length > 0;
    const temSugestao = sugestoesDoColab.length > 0;
    const statusSugestao = temSugestao ? sugestoesDoColab.map(s => s.status).join(', ') : 'SEM SUGESTÃO';

    console.log(`${c.nome}`);
    console.log(`  OpsId: ${c.opsId} | Matrícula: ${c.matricula}`);
    console.log(`  Cargo: ${c.cargo}`);
    console.log(`  Faltas (F): ${c.qtdFaltas} → ${c.datas.join(', ')}`);
    console.log(`  MDs existentes: ${mdsDoColab.length} | Reincidente: ${reincidente ? 'SIM' : 'NÃO'}`);
    console.log(`  Sugestão no banco: ${statusSugestao}`);
    console.log('');
  }

  console.log(`Total: ${lista.length} colaboradores com falta injustificada`);
  console.log(`Total sugestões no banco: ${sugestoes.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
