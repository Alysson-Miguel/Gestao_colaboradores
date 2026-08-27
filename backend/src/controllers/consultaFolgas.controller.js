/**
 * Consulta Pública de Folgas
 * Colaborador confirma identidade com CPF + Ops ID e vê as próprias
 * folgas do mês atual (DSR semanal, Folga Dominical, Troca de DSR, Folga).
 *
 * Rota pública (sem autenticação) — protegida por rate limit por IP.
 * A resposta nunca revela qual dos dois campos está errado, nem inclui
 * CPF, matrícula ou qualquer outro dado além do estritamente necessário
 * para exibir a lista de folgas.
 */
const { prisma } = require("../config/database");
const { successResponse, errorResponse } = require("../utils/response");

function agoraBrasil() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

/**
 * Rotula o registro de frequência num dos 4 tipos que fazem sentido
 * pra um colaborador entender ("DSR semanal" é a folga fixa da escala;
 * as demais são exceções/ajustes sobre ela).
 */
function labelFolga(registro) {
  const codigo = registro.tipoAusencia?.codigo;
  const justificativa = String(registro.justificativa || "");

  if (codigo === "DSR") {
    if (justificativa === "DSR_FOLGA_DOMINICAL_AUTOMATICA") return "Folga Dominical";
    if (justificativa.includes("SOLICITACAO_OPERACIONAL") || justificativa.includes("TROCA_DSR")) return "Troca de DSR";
    return "DSR Semanal";
  }
  if (codigo === "FO") return "Folga";

  return registro.tipoAusencia?.descricao || "Folga";
}

exports.consultarFolgas = async (req, res) => {
  try {
    const cpfDigits = String(req.query.cpf || "").replace(/\D/g, "");
    const opsId = String(req.query.opsId || "").trim();

    if (cpfDigits.length !== 11 || !opsId) {
      return errorResponse(res, "Informe CPF e Ops ID válidos", 400);
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { opsId },
      select: {
        opsId: true,
        cpf: true,
        nomeCompleto: true,
        turno: { select: { nomeTurno: true } },
        setor: { select: { nomeSetor: true } },
      },
    });

    // Mensagem sempre genérica — nunca revela se o Ops ID existe ou se
    // só o CPF não bateu, pra não virar um jeito de descobrir dados de outros.
    const cpfColaborador = String(colaborador?.cpf || "").replace(/\D/g, "");
    if (!colaborador || !cpfColaborador || cpfColaborador !== cpfDigits) {
      return errorResponse(res, "CPF ou Ops ID não conferem.", 404);
    }

    const agora = agoraBrasil();
    const inicioMes = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), 1));
    const fimMes = new Date(Date.UTC(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999));

    const tiposRelevantes = await prisma.tipoAusencia.findMany({
      where: { codigo: { in: ["DSR", "FO"] } },
      select: { idTipoAusencia: true },
    });
    const idsRelevantes = tiposRelevantes.map((t) => t.idTipoAusencia);

    const registros = idsRelevantes.length
      ? await prisma.frequencia.findMany({
          where: {
            opsId: colaborador.opsId,
            dataReferencia: { gte: inicioMes, lte: fimMes },
            idTipoAusencia: { in: idsRelevantes },
          },
          select: {
            dataReferencia: true,
            justificativa: true,
            tipoAusencia: { select: { codigo: true, descricao: true } },
          },
          orderBy: { dataReferencia: "asc" },
        })
      : [];

    const folgas = registros.map((r) => ({
      data: r.dataReferencia.toISOString().slice(0, 10),
      tipo: labelFolga(r),
    }));

    return successResponse(res, {
      nomeCompleto: colaborador.nomeCompleto,
      turno: colaborador.turno?.nomeTurno || null,
      setor: colaborador.setor?.nomeSetor || null,
      mesReferencia: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`,
      folgas,
    });
  } catch (err) {
    console.error("❌ consultarFolgas:", err);
    return errorResponse(res, "Erro ao consultar folgas", 500);
  }
};
