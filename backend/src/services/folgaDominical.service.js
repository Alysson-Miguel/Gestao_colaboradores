const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getDomingosDoMes(ano, mes) {
  const domingos = [];
  const data = new Date(ano, mes - 1, 1);

  while (data.getMonth() === mes - 1) {
    if (data.getDay() === 0) {
      domingos.push(
        new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()))
      );
    }
    data.setDate(data.getDate() + 1);
  }

  return domingos;
}

async function gerarFolgaDominical({ ano, mes, userId }) {
  if (!ano || !mes) throw new Error("Ano e mês são obrigatórios.");

  const existente = await prisma.folgaDominical.findFirst({
    where: { ano, mes },
  });

  if (existente) {
    throw new Error("Já existe planejamento para este mês.");
  }

  const elegiveis = await prisma.colaborador.findMany({
    where: {
      status: "ATIVO",
      escala: {
        nomeEscala: "B",
        ativo: true,
      },
    },
    select: { opsId: true },
    orderBy: { opsId: "asc" },
  });

  if (!elegiveis.length) {
    throw new Error("Nenhum colaborador elegível encontrado.");
  }

  const domingos = getDomingosDoMes(ano, mes);
  const DSR_ID = 4;

  let geradas = 0;
  let ignoradas = 0;

  await Promise.all(
    elegiveis.map(async (colab, index) => {
      const domingo = domingos[index % domingos.length];

      const freqExistente = await prisma.frequencia.findUnique({
        where: {
          opsId_dataReferencia: {
            opsId: colab.opsId,
            dataReferencia: domingo,
          },
        },
      });

      if (freqExistente) {
        if (freqExistente.manual) {
          ignoradas++;
          return;
        }

        if (
          freqExistente.idTipoAusencia &&
          freqExistente.idTipoAusencia !== DSR_ID
        ) {
          ignoradas++;
          return;
        }
      }

      await prisma.folgaDominical.create({
        data: {
          opsId: colab.opsId,
          ano,
          mes,
          dataDomingo: domingo,
          criadoPorId: userId,
        },
      });

      await prisma.frequencia.upsert({
        where: {
          opsId_dataReferencia: {
            opsId: colab.opsId,
            dataReferencia: domingo,
          },
        },
        update: {
          idTipoAusencia: DSR_ID,
          horaEntrada: null,
          horaSaida: null,
          justificativa: "DSR_FOLGA_DOMINICAL_AUTOMATICA",
          registradoPor: userId,
          manual: false,
        },
        create: {
          opsId: colab.opsId,
          dataReferencia: domingo,
          idTipoAusencia: DSR_ID,
          justificativa: "DSR_FOLGA_DOMINICAL_AUTOMATICA",
          registradoPor: userId,
          manual: false,
        },
      });

      geradas++;
    })
  );

  return {
    ano,
    mes,
    elegiveis: elegiveis.length,
    domingos: domingos.length,
    geradas,
    ignoradas,
  };
}

async function listarFolgaDominical({ ano, mes }) {
  if (!ano || !mes) {
    throw new Error("Ano e mês são obrigatórios.");
  }

  const registros = await prisma.folgaDominical.findMany({
    where: { ano, mes },
    include: {
      colaborador: {
        include: {
          turno: {
            select: {
              nomeTurno: true,
            },
          },
          setor: {
            select: {
              nomeSetor: true,
            },
          },
          lider: {
            select: {
              nomeCompleto: true,
            },
          },
        },
      },
    },
    orderBy: {
      dataDomingo: "asc",
    },
  });
console.log(JSON.stringify(registros[0], null, 2));
  if (!registros.length) {
    return null;
  }

  const resumoPorDomingo = {};

  registros.forEach((r) => {
    const data = r.dataDomingo.toISOString().split("T")[0];

    if (!resumoPorDomingo[data]) {
      resumoPorDomingo[data] = 0;
    }

    resumoPorDomingo[data]++;
  });

  const colaboradores = registros.map((r) => ({
    opsId: r.colaborador.opsId,
    nome: r.colaborador.nomeCompleto,
    turno: r.colaborador.turno?.nomeTurno || null,
    lider: r.colaborador.lider?.nomeCompleto || null,
    setor: r.colaborador.setor?.nomeSetor || null,
    dataDomingo: r.dataDomingo,
  }));

  return {
    ano,
    mes,
    total: registros.length,
    porDomingo: resumoPorDomingo,
    colaboradores,
  };
}

async function deletarFolgaDominical({ ano, mes }) {
  if (!ano || !mes) throw new Error("Ano e mês são obrigatórios.");

  const registros = await prisma.folgaDominical.findMany({
    where: { ano, mes },
    select: {
      opsId: true,
      dataDomingo: true,
    },
  });

  if (!registros.length) {
    throw new Error("Nenhum planejamento encontrado para este mês.");
  }

  const datas = registros.map((r) => r.dataDomingo);

  // 🔹 Limpar DSR automático em massa
  await prisma.frequencia.updateMany({
    where: {
      dataReferencia: { in: datas },
      idTipoAusencia: 4,
      justificativa: "DSR_FOLGA_DOMINICAL_AUTOMATICA",
    },
    data: {
      idTipoAusencia: null,
      justificativa: null,
      registradoPor: null,
      manual: false,
    },
  });

  // 🔹 Remover planejamento
  await prisma.folgaDominical.deleteMany({
    where: { ano, mes },
  });

  return {
    ano,
    mes,
    removidos: registros.length,
  };
}

module.exports = {
  gerarFolgaDominical,
  listarFolgaDominical,
  deletarFolgaDominical,
};