const { detectarFaltasAutomatico } = require('../src/services/detectarFaltasAutomatico.service');
const { prisma } = require('../src/config/database');

async function main() {
  console.log('🚀 Iniciando backfill de sugestões de MD...\n');
  const resultado = await detectarFaltasAutomatico('2026-01-01', '2026-04-01');
  console.log('\n📊 Resultado:', resultado);
}

main().catch(console.error).finally(() => prisma.$disconnect());
