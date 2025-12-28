import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Rodando seed de Escalas...");

  await prisma.escala.createMany({
    data: [
      {
        nomeEscala: "A",
        tipoEscala: "FIXA",
        diasTrabalhados: 5,
        diasFolga: 2,
        descricao: "Folga: Quarta e Domingo",
        ativo: true,
      },
      {
        nomeEscala: "B",
        tipoEscala: "FIXA",
        diasTrabalhados: 5,
        diasFolga: 2,
        descricao: "Folga: Segunda e Terça",
        ativo: true,
      },
      {
        nomeEscala: "C",
        tipoEscala: "FIXA",
        diasTrabalhados: 5,
        diasFolga: 2,
        descricao: "Folga: Quinta e Sexta",
        ativo: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed de Escalas concluído");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
