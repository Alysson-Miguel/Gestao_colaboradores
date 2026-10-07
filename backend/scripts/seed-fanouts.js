// Carga inicial dos fanouts da Label (estação 1), transcrita das tabelas da operação:
// Termoplástica, Esteira U, Esteira Linear e Setup D+1. Esteira FULL (Esteira C) fica vazia:
// será preenchida na tela Operação > Label > Configuração.
//
// Seguro para rodar de novo: só preenche posições que estão VAZIAS, nunca sobrescreve o que
// já foi editado pela tela. Uso: node scripts/seed-fanouts.js
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ID_ESTACAO = 1;

// { braço: [fanouts do lado A, fanouts do lado B] } — [] = sem fanout ("-" ou célula vazia)
const TERMOPLASTICA = {
  1: [["LPE-11", "LPE-08", "LPE-14", "ES-02", "SP-10"], ["LPE-12", "LPE-07", "LPI-02", "CE-03", "LRN-93"]],
  2: [["LPE-02", "LPE-03", "LPE-06", "PR-01"], ["LPB-04", "LPB-02", "LPB-02-X", "RS-02"]],
  3: [["LCE-02", "LCE-05", "LCE-01", "LCE-04", "LPB-94", "LRN-92", "LRN-94"], ["SP-08", "RJ-02", "LAL-90", "LAL-91", "LAL-04", "LAL-02", "LAL-03"]],
  4: [["BA-02", "BA-17", "BA-19", "MG-02", "SP-07", "GO-02", "SC-01"], ["LPE-90", "LPE-91", "LPE-92", "LPE-93", "LPE-94", "LPE-96", "LPB-03"]],
  5: [["LPB-90", "LPB-91", "LPB-92", "LPB-93", "LPE-11", "LPE-12"], ["LRN-03", "LRN-01", "LRN-03-X", "LRN-90", "LSE-01", "LSE-03"]],
  6: [[], []],
  7: [[], []],
};

const ESTEIRA_U = {
  1: [["LPE-11", "LPE-12", "LSE-01", "CORREIOS"], ["LPE-12", "LPB-91", "LPE-08", "LRN-90"]],
  2: [["LBA-19", "LBA-17", "LPB-04", "LPE-91"], ["LSE-01", "LPE-12", "LPE-11", "CORREIOS"]],
  3: [["LPE-93", "SP-08", "LAL-01"], ["LBA-19", "LBA-17", "LPE-91", "LPB-04"]],
  4: [["LPE-11", "SP-07", "LCE-02"], ["LAL-01", "SP-08", "LPE-93"]],
  5: [["LPI-02", "LAL-03", "LSE-03", "LPE-02"], ["LPE-11", "LCE-02", "SP-07"]],
  6: [["LCE-01", "RJ-01", "GO-01"], ["LAL-03", "LSE-03", "LPE-02", "LPI-02"]],
  7: [["LPB-03", "BA-02", "SP-05"], ["RJ-02", "GO-02", "LCE-01"]],
  8: [["LPB-02X", "PR-01", "LPE-03"], ["LPB-03", "SP-05", "BA-02"]],
  9: [["LCE-05", "LPE-96", "RS-01", "LPE-07"], ["LPB-02X", "PR-01", "LPE-03"]],
  10: [["MG-02", "LPE-92", "SC-01", "LPE-06"], ["LCE-05", "LPE-96", "RS-02", "LPE-07"]],
  11: [["LRN-01", "LPE-94", "LPE-12", "LPE-04"], ["MG-02", "LPE-92", "SC-01", "LPE-06"]],
  12: [["LRN-03X", "LPB-90", "LPB-02"], ["LPB-92", "LRN-03", "LAL-02"]],
  13: [["LCE-04", "LPE-90", "LAL-90", "LAL-91"], ["LRN-01", "LPE-94", "LPE-12", "LPE-04"]],
  14: [["LRN-03", "LAL-02", "J&T", "LPB-92"], ["LRN-03X", "J&T", "LPB-02"]],
  15: [["LPB-91", "LPE-12", "LRN-90", "LPE-08"], ["LAL-91", "LPE-90", "LAL-90", "LCE-04"]],
};

const ESTEIRA_LINEAR = {
  1: [["LPE-11", "LRN-01", "CORREIOS"], ["LAL-91", "LPE-96", "LPE-03"]],
  2: [["LPE-12", "LPB-03", "J&T"], ["LPE-92", "LPE-02", "SP-05"]],
  3: [["FBS-PE03", "LSE-01", "SP-08"], ["LPB-90", "LPB-02X", "LCE-05"]],
  4: [["LRN-03", "LAL-02", "SC-01"], ["LPE-07", "LPE-03", "LPB-92"]],
  5: [["LCE-01", "LPB-90", "LPB-04"], ["LPE-08", "LRN-03X", "ES-02"]],
  6: [["LRN-01", "LRN-03X", "LRN-03"], ["LPB-02", "SP-07", "LPE-91"]],
  7: [["LRN-90", "LCE-02", "LCE-05"], ["MG-02", "LCE-04", "LPB-02"]],
  8: [["LPE-12", "LPE-06", "LPE-08"], ["LPB-91", "LPE-91", "LPB-92"]],
  9: [["LPE-07", "LPE-08", "LPE-11"], ["PR-01", "LAL-03", "BA-02"]],
  10: [[], ["LPE-06", "LAL-90", "LPE-96"]],
};

// Setup D+1: posições numeradas, só lado A
const SETUP_D1 = {
  1: ["LPE-12", "LPE-08"],
  2: ["LPE-07", "LPE-06"],
  3: ["LPE-04", "LPE-03"],
  4: ["LPE-02", "LPE-11"],
  5: ["LPB-04", "LPB-03"],
};

const POR_ESTEIRA = {
  "Esteira Termoplástica": TERMOPLASTICA,
  "Esteira U": ESTEIRA_U,
  "Esteira Linear": ESTEIRA_LINEAR,
};

async function main() {
  const resumo = { preenchidas: 0, jaTinham: 0, vazias: 0, semBraco: [] };

  for (const [nome, tabela] of Object.entries(POR_ESTEIRA)) {
    const esteira = await prisma.mapaEsteira.findFirst({ where: { idEstacao: ID_ESTACAO, nome } });
    if (!esteira) {
      console.log(`⚠️  ${nome} não encontrada — rode antes scripts/seed-mapa-operacional.js`);
      continue;
    }
    for (const [numero, [ladoA, ladoB]] of Object.entries(tabela)) {
      for (const [lado, lista] of [["A", ladoA], ["B", ladoB]]) {
        const braco = await prisma.mapaEsteiraBraco.findFirst({ where: { idEsteira: esteira.idEsteira, numero: Number(numero), lado } });
        if (!braco) {
          resumo.semBraco.push(`${nome} ${numero}${lado}`);
          continue;
        }
        if (!lista.length) { resumo.vazias += 1; continue; }
        if (braco.fanouts.length) { resumo.jaTinham += 1; continue; }
        await prisma.$transaction([
          prisma.mapaEsteiraBraco.update({ where: { idEsteiraBraco: braco.idEsteiraBraco }, data: { fanouts: lista } }),
          prisma.mapaFanoutHistorico.create({
            data: { idEstacao: ID_ESTACAO, escopo: "ESTEIRA", idEsteira: esteira.idEsteira, braco: Number(numero), lado, acao: "CARGA_INICIAL", antes: [], depois: lista, usuarioNome: "Carga inicial" },
          }),
        ]);
        resumo.preenchidas += 1;
      }
    }
  }

  for (const [posicao, lista] of Object.entries(SETUP_D1)) {
    const atual = await prisma.mapaSetupFanout.findUnique({ where: { idEstacao_posicao: { idEstacao: ID_ESTACAO, posicao: Number(posicao) } } });
    if (atual?.fanouts.length) { resumo.jaTinham += 1; continue; }
    await prisma.$transaction([
      prisma.mapaSetupFanout.upsert({
        where: { idEstacao_posicao: { idEstacao: ID_ESTACAO, posicao: Number(posicao) } },
        create: { idEstacao: ID_ESTACAO, posicao: Number(posicao), fanouts: lista },
        update: { fanouts: lista },
      }),
      prisma.mapaFanoutHistorico.create({
        data: { idEstacao: ID_ESTACAO, escopo: "SETUP_D1", braco: Number(posicao), lado: "A", acao: "CARGA_INICIAL", antes: [], depois: lista, usuarioNome: "Carga inicial" },
      }),
    ]);
    resumo.preenchidas += 1;
  }

  console.log(`✅ Fanouts: ${resumo.preenchidas} posições preenchidas, ${resumo.jaTinham} já tinham dados (mantidas), ${resumo.vazias} sem fanout.`);
  if (resumo.semBraco.length) console.log("⚠️  Braços não encontrados no cadastro:", resumo.semBraco.join(", "));
}

main()
  .catch((err) => {
    console.error("❌ Erro na carga de fanouts:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
