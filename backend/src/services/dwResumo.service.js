const { buscarDwPlanejado } = require('./googleSheetsDW.service');
const { buscarDwPlanejadoBanco } = require('./dwPlanejado.service');
const { prisma } = require('../config/database');

const ESTACAO_SHEETS = 1;

const buscarDwResumo = async ({ data, idTurno, idEstacao }) => {
  const turnoMap = { 1: 'T1', 2: 'T2', 3: 'T3' };
  const estacaoNum = idEstacao ? Number(idEstacao) : null;

  // 1️⃣ Planejado
  let dwPlanejado = 0;
  if (estacaoNum === ESTACAO_SHEETS || !estacaoNum) {
    const planejadoResult = await buscarDwPlanejado(turnoMap[idTurno], data);
    dwPlanejado = planejadoResult.data.dwPlanejado;
  } else {
    const registro = await buscarDwPlanejadoBanco({ data, idTurno, idEstacao: estacaoNum });
    dwPlanejado = registro?.quantidade ?? 0;
  }

  // 2️⃣ Real (Banco)
  const where = {
    data: new Date(data),
    idTurno
  };

  if (idEstacao) where.idEstacao = Number(idEstacao);

  const dwReais = await prisma.dwReal.findMany({
    where,
    include: {
      empresa: true
    },
    orderBy: {
      empresa: { nome: 'asc' }
    }
  });

  const totalReal = dwReais.reduce(
    (sum, r) => sum + r.quantidade,
    0
  );

  // 3️⃣ Diferença
  const diferenca = totalReal - dwPlanejado;

  return {
    data,
    idTurno,
    planejado: dwPlanejado,
    real: totalReal,
    diferenca,
    empresas: dwReais.map(r => ({
      idEmpresa: r.idEmpresa,
      empresa: r.empresa.nome,
      quantidade: r.quantidade,
      observacao: r.observacao
    }))
  };
};

module.exports = {
  buscarDwResumo
};
