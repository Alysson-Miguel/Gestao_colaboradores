/**
 * Troca o líder de uma lista de colaboradores ATIVOS por um líder ATIVO informado.
 * Só altera quem hoje tem líder diferente do novo. Registra no histórico de movimentação.
 *   node scripts/trocar-lider.js <nomes.txt> <opsIdNovoLider> [--setor "Nome do Setor"]            (dry-run)
 *   node scripts/trocar-lider.js <nomes.txt> <opsIdNovoLider> [--setor "Nome do Setor"] --apply    (grava)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { getEstacoesDoGrupo } = require("../src/config/estacaoGrupos");

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const iSetor = args.indexOf("--setor");
const setorFiltro = iSetor >= 0 ? args[iSetor + 1] : null;
const [arquivo, opsIdLider] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--setor");

(async () => {
  if (!arquivo || !opsIdLider) throw new Error("Uso: node scripts/trocar-lider.js <nomes.txt> <opsIdNovoLider> [--setor X] [--apply]");

  const lider = await prisma.colaborador.findUnique({ where: { opsId: opsIdLider }, select: { opsId: true, nomeCompleto: true, status: true, idEstacao: true } });
  if (!lider) throw new Error(`Líder ${opsIdLider} não encontrado`);
  if (lider.status !== "ATIVO") throw new Error(`Líder ${lider.nomeCompleto} não está ATIVO (${lider.status})`);

  const nomes = fs.readFileSync(arquivo, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const alvo = await prisma.colaborador.findMany({
    where: { nomeCompleto: { in: nomes, mode: "insensitive" }, status: "ATIVO", ...(setorFiltro && { setor: { nomeSetor: setorFiltro } }) },
    select: { opsId: true, nomeCompleto: true, idEstacao: true, idSetor: true, idTurno: true, idCargo: true, idLider: true, lider: { select: { nomeCompleto: true, status: true } } },
  });

  const foraDoGrupo = alvo.filter((c) => !getEstacoesDoGrupo(c.idEstacao).includes(lider.idEstacao));
  if (foraDoGrupo.length) throw new Error(`${foraDoGrupo.length} colaborador(es) em estação incompatível com a do líder`);

  const mudar = alvo.filter((c) => c.idLider !== lider.opsId && c.opsId !== lider.opsId);
  console.log(`líder: ${lider.nomeCompleto} (${lider.opsId}) | selecionados: ${alvo.length}${setorFiltro ? ` (setor ${setorFiltro})` : ""} | a alterar: ${mudar.length}`);
  const g = {};
  mudar.forEach((c) => { const k = `${c.lider?.nomeCompleto ?? "SEM LÍDER"} (${c.lider?.status ?? "-"})`; g[k] = (g[k] || 0) + 1; });
  console.table(g);

  if (!APPLY) { console.log("dry-run: nada gravado. Use --apply."); await prisma.$disconnect(); return; }

  await prisma.$transaction(async (tx) => {
    for (const c of mudar) {
      await tx.colaborador.update({ where: { opsId: c.opsId }, data: { lider: { connect: { opsId: lider.opsId } } } });
      await tx.historicoMovimentacao.create({
        data: {
          opsId: c.opsId, tipoMovimentacao: "ORGANIZACIONAL",
          setorAnterior: c.idSetor, setorNovo: c.idSetor, turnoAnterior: c.idTurno, turnoNovo: c.idTurno,
          cargoAnterior: c.idCargo, cargoNovo: c.idCargo, estacaoAnterior: c.idEstacao, estacaoNova: c.idEstacao,
          liderAnterior: c.idLider, liderNovo: lider.opsId, dataEfetivacao: new Date(),
          motivo: "Correção: líder anterior estava INATIVO",
        },
      });
    }
  }, { timeout: 60000 });

  const restantes = await prisma.colaborador.count({ where: { opsId: { in: alvo.map((c) => c.opsId) }, idLider: { not: lider.opsId } } });
  console.log(`atualizados: ${mudar.length} | selecionados ainda com outro líder: ${restantes}`);
  await prisma.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
