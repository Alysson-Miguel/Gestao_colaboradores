/**
 * fix-historico-escala-duplicado.js
 *
 * Corrige colaboradores com mais de um registro aberto (dataFim = null)
 * em ColaboradorEscalaHistorico — resultado de importações em lote que
 * não fechavam o histórico anterior antes de criar o novo.
 *
 * Para cada colaborador afetado:
 *   - Ordena os registros por dataInicio ASC
 *   - Mantém o mais recente aberto (dataFim = null)
 *   - Fecha os anteriores com dataFim = (próximo.dataInicio - 1 dia)
 *
 * Uso:
 *   node scripts/fix-historico-escala-duplicado.js [--dry-run]
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`\n🔧 fix-historico-escala-duplicado — modo: ${DRY_RUN ? "DRY RUN (sem alterações)" : "PRODUÇÃO"}\n`);

  /* 1. Busca todos os registros abertos agrupados por opsId */
  const abertos = await prisma.colaboradorEscalaHistorico.findMany({
    where: { dataFim: null },
    orderBy: [{ opsId: "asc" }, { dataInicio: "asc" }],
    select: { id: true, opsId: true, idEscala: true, dataInicio: true },
  });

  /* 2. Agrupa por colaborador */
  const porColaborador = {};
  for (const r of abertos) {
    if (!porColaborador[r.opsId]) porColaborador[r.opsId] = [];
    porColaborador[r.opsId].push(r);
  }

  let totalAfetados = 0;
  let totalFechados = 0;

  for (const [opsId, registros] of Object.entries(porColaborador)) {
    if (registros.length < 2) continue; // OK — só um aberto

    totalAfetados++;
    console.log(`\n👤 ${opsId} — ${registros.length} registros abertos:`);

    /* Ordena por dataInicio ASC (já vem ordenado, mas garantia) */
    registros.sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

    /* Fecha todos exceto o último (mais recente) */
    for (let i = 0; i < registros.length - 1; i++) {
      const atual   = registros[i];
      const proximo = registros[i + 1];

      const dataFimCorrigida = new Date(new Date(proximo.dataInicio).getTime() - 86400000);

      console.log(`   ✂️  id=${atual.id} idEscala=${atual.idEscala} dataInicio=${atual.dataInicio.toISOString().slice(0,10)} → dataFim=${dataFimCorrigida.toISOString().slice(0,10)}`);

      if (!DRY_RUN) {
        await prisma.colaboradorEscalaHistorico.update({
          where: { id: atual.id },
          data: { dataFim: dataFimCorrigida },
        });
      }
      totalFechados++;
    }

    const ultimo = registros[registros.length - 1];
    console.log(`   ✅ id=${ultimo.id} idEscala=${ultimo.idEscala} dataInicio=${ultimo.dataInicio.toISOString().slice(0,10)} → mantido aberto (atual)`);
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Colaboradores afetados : ${totalAfetados}`);
  console.log(`   Registros fechados     : ${totalFechados}`);
  if (DRY_RUN) console.log(`\n⚠️  Nenhuma alteração realizada (--dry-run). Remova a flag para aplicar.`);
  else console.log(`\n✅ Correção aplicada com sucesso.`);
}

main()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
