const { prisma } = require('../config/database');
const { buscarDwPlanejado } = require("./googleSheetsDW.service");
const { buscarDwPlanejadoBanco } = require("./dwPlanejado.service");

const ESTACAO_SHEETS = 1;

/* ==========================
   EMPRESAS FIXAS DO DW
========================== */
const EMPRESAS_FIXAS = {
  12: "SRM",
  13: "Fenix",
  14: "Horeca",
};

const IDS_EMPRESAS_FIXAS = Object.keys(EMPRESAS_FIXAS).map(Number);

const buscarDwLista = async ({ data, idTurno, idEmpresa, idEstacao }) => {
  const where = {
    idEmpresa: { in: IDS_EMPRESAS_FIXAS },
  };

  if (data) where.data = new Date(data);
  if (idTurno) where.idTurno = Number(idTurno);
  if (idEstacao) where.idEstacao = Number(idEstacao);

  if (idEmpresa && IDS_EMPRESAS_FIXAS.includes(Number(idEmpresa))) {
    where.idEmpresa = Number(idEmpresa);
  }

  const dwReais = await prisma.dwReal.findMany({
    where,
    orderBy: [{ data: "desc" }, { idTurno: "asc" }],
  });

  const agrupado = {};
  const turnoMap = { 1: "T1", 2: "T2", 3: "T3" };
  const estacaoNum = idEstacao ? Number(idEstacao) : null;

  for (const r of dwReais) {
    const dataISO = r.data.toISOString().slice(0, 10);
    const chave = `${dataISO}_${r.idTurno}`;

    if (!agrupado[chave]) {
      let planejado = 0;

      if (estacaoNum === ESTACAO_SHEETS || !estacaoNum) {
        // Estação 1 ou sem estação: busca no Sheets
        const planejadoRes = await buscarDwPlanejado(turnoMap[r.idTurno], dataISO);
        planejado = planejadoRes.data.dwPlanejado;
      } else {
        // Demais estações: busca no banco
        const registro = await buscarDwPlanejadoBanco({
          data: dataISO,
          idTurno: r.idTurno,
          idEstacao: estacaoNum
        });
        planejado = registro?.quantidade ?? 0;
      }

      agrupado[chave] = {
        data: dataISO,
        turno: turnoMap[r.idTurno],
        planejado,
        empresas: { SRM: 0, Fenix: 0, Horeca: 0 },
        totalReal: 0,
      };
    }

    const nomeEmpresa = EMPRESAS_FIXAS[r.idEmpresa];
    if (!nomeEmpresa) continue;

    agrupado[chave].empresas[nomeEmpresa] += r.quantidade;
    agrupado[chave].totalReal += r.quantidade;
  }

  return Object.values(agrupado);
};

module.exports = { buscarDwLista };
