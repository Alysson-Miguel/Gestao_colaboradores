const { prisma } = require("../config/database");
const { StatusMedidaDisciplinar } = require("@prisma/client");

async function detectarViolacaoDisciplinar(idFrequencia) {
  try {

    console.log("DETECTOR DISPARADO →", idFrequencia);

    /* ==============================
       BUSCAR FREQUÊNCIA
    ============================== */

    const frequencia = await prisma.frequencia.findUnique({
      where: { idFrequencia: parseInt(idFrequencia) },
      include: { tipoAusencia: true },
    });

    if (!frequencia) {
      console.log("⚠️ Frequência não encontrada");
      return;
    }

    console.log("TIPO AUSENCIA →", frequencia.tipoAusencia?.codigo);

    /* ==============================
       VERIFICAR SE É FALTA NÃO JUSTIFICADA
    ============================== */

    if (frequencia.tipoAusencia?.codigo !== "F") {
      console.log("Não é falta → ignorado");
      return;
    }

    /* ==============================
       EVITAR DUPLICAÇÃO
    ============================== */

    const jaExiste = await prisma.sugestaoMedidaDisciplinar.findFirst({
      where: { idFrequencia: frequencia.idFrequencia },
    });

    if (jaExiste) {
      console.log("Sugestão já existe → ignorado");
      return;
    }

    /* ==============================
       CONTAR HISTÓRICO (1ª ocorrência ou reincidência)
    ============================== */

    const historicoCount = await prisma.medidaDisciplinar.count({
      where: {
        opsId: frequencia.opsId,
        violacao: "FALTA_INJUSTIFICADA",
        status: { not: StatusMedidaDisciplinar.CANCELADA },
      },
    });

    const frequenciaViolacao = historicoCount === 0 ? "PRIMEIRA_OCORRENCIA" : "REINCIDENCIA";

    /* ==============================
       BUSCAR MATRIZ DISCIPLINAR
    ============================== */

    const matriz = await prisma.matrizMedidaDisciplinar.findFirst({
      where: {
        violacao: "FALTA_INJUSTIFICADA",
        frequencia: frequenciaViolacao,
      },
    });

    // Fallback: se não achar pela frequência, pega qualquer uma para FALTA_INJUSTIFICADA
    const matrizFinal = matriz ?? await prisma.matrizMedidaDisciplinar.findFirst({
      where: { violacao: "FALTA_INJUSTIFICADA" },
    });

    if (!matrizFinal) {
      console.log("⚠️ Matriz disciplinar não encontrada para FALTA_INJUSTIFICADA — sugestão não criada");
      return;
    }

    /* ==============================
       VERIFICAR MD MANUAL EXISTENTE
    ============================== */

    const mdManualExistente = await prisma.medidaDisciplinar.findFirst({
      where: {
        opsId: frequencia.opsId,
        violacao: "FALTA_INJUSTIFICADA",
        origem: "MANUAL",
        status: { not: StatusMedidaDisciplinar.CANCELADA },
      },
    });

    const statusSugestao = mdManualExistente ? "REJEITADA" : "PENDENTE";
    const aprovadoPor = mdManualExistente
      ? "SISTEMA — MD manual já registrada"
      : null;

    /* ==============================
       CRIAR SUGESTÃO
    ============================== */

    await prisma.sugestaoMedidaDisciplinar.create({
      data: {
        opsId: frequencia.opsId,
        idFrequencia: frequencia.idFrequencia,
        dataReferencia: frequencia.dataReferencia,
        violacao: "FALTA_INJUSTIFICADA",
        consequencia: matrizFinal.consequencia,
        diasSuspensao: matrizFinal.diasSuspensao,
        status: statusSugestao,
        ...(aprovadoPor && { aprovadoPor }),
      },
    });

    if (mdManualExistente) {
      console.log("⚠️ Sugestão REJEITADA — MD manual já existe para", frequencia.opsId);
    } else {
      console.log("✅ Sugestão criada para", frequencia.opsId, "em", frequencia.dataReferencia, `(${frequenciaViolacao})`);
    }

  } catch (error) {
    console.error("❌ detectorMedidaDisciplinar:", error);
  }
}

module.exports = detectarViolacaoDisciplinar;
