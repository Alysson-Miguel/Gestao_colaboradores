// Seed inicial do Mapa Operacional (Fase 1 — Esteiras), estação 1 (Jaboatão).
//
// Contagem de braços confirmada contra dados reais da planilha de Workstation
// (ver backend/src/services/mapaOperacional/workstationSheets.service.js):
// Termoplástica (7), Esteira U (15), Esteira Linear (10), Esteira FULL (10,
// confirmado com o usuário — códigos P3_AU01 a P3_AU20).
// "Esteira C" e "Setup D+1"/"FULL D+1" ficam de fora deste seed — a primeira
// porque o legado não tem a contagem de braços hardcoded em lugar nenhum (só
// lia dinamicamente da planilha "Base", ainda não compartilhada); a segunda
// porque não é um grid de braços — é um pool compartilhado (ver
// getPessoasAtivasFullD1 no workstationSheets.service.js). Rodar este seed de
// novo é seguro (idempotente via skipDuplicates + upsert).
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ID_ESTACAO_JABOATAO = 1;

const ESTEIRAS = [
  { nome: "Esteira Termoplástica", formato: "LINHA", qtdBracos: 7, ordem: 1 },
  { nome: "Esteira U", formato: "U", qtdBracos: 15, ordem: 2 },
  { nome: "Esteira Linear", formato: "LINHA", qtdBracos: 10, ordem: 3 },
  { nome: "Esteira FULL", formato: "LINHA", qtdBracos: 10, ordem: 4 },
];

async function main() {
  for (const cfg of ESTEIRAS) {
    const esteira = await prisma.mapaEsteira.upsert({
      where: { idEstacao_nome: { idEstacao: ID_ESTACAO_JABOATAO, nome: cfg.nome } },
      update: { formato: cfg.formato, qtdBracos: cfg.qtdBracos, ordem: cfg.ordem },
      create: {
        idEstacao: ID_ESTACAO_JABOATAO,
        nome: cfg.nome,
        formato: cfg.formato,
        qtdBracos: cfg.qtdBracos,
        ordem: cfg.ordem,
      },
    });

    const bracosData = [];
    for (let numero = 1; numero <= cfg.qtdBracos; numero++) {
      bracosData.push({ idEsteira: esteira.idEsteira, numero, lado: "A" });
      bracosData.push({ idEsteira: esteira.idEsteira, numero, lado: "B" });
    }

    await prisma.mapaEsteiraBraco.createMany({
      data: bracosData,
      skipDuplicates: true,
    });

    console.log(`✅ ${cfg.nome}: esteira id=${esteira.idEsteira}, ${cfg.qtdBracos} braços x 2 lados = ${bracosData.length} registros de braço garantidos.`);
  }

  console.log("\n🌱 Seed do Mapa Operacional (Fase 1) concluído.");
  console.log("⚠️  Fanouts NÃO foram importados (planilha 'Base' ainda não compartilhada com o service account) — todos os braços ficam com fanouts=[] até a importação real.");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao rodar seed do Mapa Operacional:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
