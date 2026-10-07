const { prisma } = require("../../config/database");
const { getLocaisAutomaticosPorOps, normalizeOpsId } = require("./workstationSheets.service");

/**
 * Regras de conflito ao alocar manualmente alguém numa esteira (uma pessoa só pode estar em um lugar):
 * - packing automático (Workstation) -> BLOQUEIA, na própria esteira ou em outra;
 * - alocada em OUTRA esteira/doca/time -> BLOQUEIA e orienta a pedir Sinergia Interna;
 * - já alocada em outra função (ou outro braço) na MESMA esteira -> pede confirmação do líder.
 * Retorna null quando está livre, ou { codigo, mensagem, atual? }.
 */

const LABOR_LABEL = {
  PACKING: "Packing",
  PESCA: "Pesca",
  GOL: "Gol",
  ENDERECAMENTO: "Endereçamento",
  INDUCAO: "Indução",
  ABASTECEDOR: "Abastecedor",
  MONTAGEM_SCUTTLE: "5S / Montagem Scuttle",
  VOLANTE: "Volante",
  LOG_II: "LOG II",
  FULL_D1: "FULL D+1",
};
const OPERACAO_LABEL = { INBOUND: "Recebimento", OUTBOUND: "Expedição" };
const ESTEIRA_FULL = "Esteira FULL";

const SINERGIA = "Solicite uma Sinergia Interna para alocar essa pessoa aqui.";

function descreverPosicao(a, nomeEsteira) {
  if (a.numeroDoca != null) {
    const op = a.operacaoDoca ? ` (${OPERACAO_LABEL[a.operacaoDoca]})` : "";
    return `Doca ${a.numeroDoca}${op}`;
  }
  const funcao = LABOR_LABEL[a.labor] || a.labor;
  const braco = a.braco != null ? ` · Braço ${a.braco}${a.lado}` : "";
  return `${nomeEsteira} · ${funcao}${braco}`;
}

async function localAutomatico(opsId) {
  try {
    return (await getLocaisAutomaticosPorOps([opsId])).get(normalizeOpsId(opsId)) || null;
  } catch (err) {
    // Sem a planilha, cai no que o job de sincronização já gravou (atualiza a cada minuto).
    console.error("⚠️ [CONFLITO-ALOCACAO] Workstation indisponível, usando o banco:", err.message);
    const linha = await prisma.mapaAlocacao.findFirst({
      where: { opsId, origem: "AUTO", fim: null },
      include: { esteira: { select: { nome: true } } },
    });
    if (!linha) return null;
    const esteira = linha.esteira?.nome || ESTEIRA_FULL;
    return { esteira, local: descreverPosicao(linha, esteira) };
  }
}

async function avaliarConflitoAlocacao({ colaborador, esteira, labor, braco, lado }) {
  const { opsId, nomeCompleto } = colaborador;

  // 1) Packing automático
  const auto = await localAutomatico(opsId);
  if (auto) {
    if (auto.esteira === esteira.nome) {
      return {
        codigo: "PACKING_AUTOMATICO",
        mensagem: `${nomeCompleto} está no packing automático (${auto.local}) e não pode receber outra função. É preciso encerrar o login na Workstation antes.`,
      };
    }
    return {
      codigo: "OUTRA_ESTEIRA",
      mensagem: `${nomeCompleto} está no packing automático em ${auto.local}. ${SINERGIA}`,
    };
  }

  // 2) Alocação manual ativa (esteira, FULL D+1 ou doca)
  const manual = await prisma.mapaAlocacao.findFirst({
    where: { opsId, fim: null, origem: "MANUAL" },
    include: { esteira: { select: { nome: true } } },
  });
  if (manual) {
    const nomeEsteira = manual.esteira?.nome || (manual.labor === "FULL_D1" ? ESTEIRA_FULL : null);
    const atual = descreverPosicao(manual, nomeEsteira || "—");

    if (manual.numeroDoca != null || nomeEsteira !== esteira.nome) {
      return {
        codigo: "OUTRA_ESTEIRA",
        mensagem: `${nomeCompleto} já tem alocação em ${atual}. ${SINERGIA}`,
      };
    }

    const mesmoLugar = manual.labor === labor && (manual.braco ?? null) === (braco != null ? Number(braco) : null) && (manual.lado ?? null) === (lado ? String(lado).toUpperCase() : null);
    if (mesmoLugar) {
      return { codigo: "JA_ALOCADO", mensagem: `${nomeCompleto} já tem essa alocação (${atual}).` };
    }
    return {
      codigo: "CONFIRMAR_SUBSTITUICAO",
      atual,
      mensagem: `${nomeCompleto} já tem alocação em ${atual}. Confirma mover para ${descreverPosicao({ labor, braco, lado }, esteira.nome)}?`,
    };
  }

  // 3) Integrante de time alocado numa doca
  const times = await prisma.timeIntegrante.findMany({ where: { opsId }, select: { idTime: true } });
  if (times.length) {
    const doca = await prisma.mapaAlocacao.findFirst({
      where: { idTime: { in: times.map((t) => t.idTime) }, fim: null, numeroDoca: { not: null } },
      include: { time: { select: { nome: true } } },
    });
    if (doca) {
      return {
        codigo: "OUTRA_ESTEIRA",
        mensagem: `${nomeCompleto} está na Doca ${doca.numeroDoca} pelo time ${doca.time?.nome || ""}. ${SINERGIA}`,
      };
    }
  }

  return null;
}

module.exports = { avaliarConflitoAlocacao };
