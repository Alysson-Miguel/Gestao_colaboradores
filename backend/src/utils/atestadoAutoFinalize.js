// src/utils/atestadoAutoFinalize.js
const { prisma } = require("../config/database");

async function finalizarAtestadosVencidos() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  await prisma.atestadoMedico.updateMany({
    where: {
      status: "ATIVO",
      dataFim: { lt: hoje },
    },
    data: { status: "FINALIZADO" },
  });
}

module.exports = { finalizarAtestadosVencidos };
