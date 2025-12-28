const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listarEscalas() {
  return prisma.escala.findMany({
    where: {
      ativo: true,
    },
    orderBy: {
      nomeEscala: "asc",
    },
    select: {
      idEscala: true,
      nomeEscala: true,
      descricao: true,
    },
  });
}

module.exports = {
  listarEscalas,
};
