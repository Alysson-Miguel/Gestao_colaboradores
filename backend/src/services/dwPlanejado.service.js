const { prisma } = require('../config/database');

/**
 * Salvar (upsert manual) DW Planejado para estações != 1
 * Usa findFirst + update/create para evitar problema de NULL em unique constraint
 */
const salvarDwPlanejado = async ({ data, idTurno, idEstacao, quantidade }) => {
  const dataDate = new Date(data);

  const existing = await prisma.dwPlanejado.findFirst({
    where: { data: dataDate, idTurno, idEstacao }
  });

  if (existing) {
    return prisma.dwPlanejado.update({
      where: { id: existing.id },
      data: { quantidade }
    });
  }

  return prisma.dwPlanejado.create({
    data: { data: dataDate, idTurno, idEstacao, quantidade }
  });
};

/**
 * Buscar DW Planejado do banco por data + turno + estacao
 */
const buscarDwPlanejadoBanco = async ({ data, idTurno, idEstacao }) => {
  return prisma.dwPlanejado.findFirst({
    where: {
      data: new Date(data),
      idTurno,
      idEstacao
    }
  });
};

module.exports = { salvarDwPlanejado, buscarDwPlanejadoBanco };
