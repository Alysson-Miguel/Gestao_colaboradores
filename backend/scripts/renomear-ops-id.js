/**
 * Renomeia OPS IDs informados, propagando a troca por todas as tabelas.
 *   node scripts/renomear-ops-id.js ANTIGO=NOVO [ANTIGO=NOVO ...]           (dry-run)
 *   node scripts/renomear-ops-id.js ANTIGO=NOVO [ANTIGO=NOVO ...] --apply   (grava)
 * O novo ID precisa seguir o formato Ops + números e não pode já existir.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { normalizarOpsId } = require("../src/utils/validacaoCadastro");
const { planejar, mostrarPlano, aplicar } = require("./lib/migrar-ops-id");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

(async () => {
  const pares = process.argv.slice(2).filter((a) => a.includes("="));
  if (!pares.length) throw new Error("Informe pares ANTIGO=NOVO");

  const mapa = pares.map((p) => {
    const [antigo, novo] = p.split("=");
    const v = normalizarOpsId(novo);
    if (v.erro) throw new Error(v.erro);
    return { opsId: antigo.trim(), novo: v.opsId };
  });

  const nomes = Object.fromEntries(
    (await prisma.colaborador.findMany({ where: { opsId: { in: mapa.map((m) => m.opsId) } }, select: { opsId: true, nomeCompleto: true } }))
      .map((c) => [c.opsId, c.nomeCompleto])
  );

  const plano = await planejar(prisma, mapa);
  mostrarPlano(mapa, plano, nomes);

  if (!APPLY) { console.log("dry-run: nada gravado. Use --apply."); await prisma.$disconnect(); return; }

  await aplicar(prisma, mapa, plano);
  await prisma.$disconnect();
})().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
