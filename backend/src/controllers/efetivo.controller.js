const { prisma } = require("../config/database");
const { successResponse, errorResponse } = require("../utils/response");
const { getTurnoOperacionalAtual, formatDataHora } = require("../utils/turnoMapaOperacional");
const { contextoDoSetor, FILTRO_CARGO_PRISMA } = require("../services/mapaOperacional/colaboradorElegibilidade.service");
const { encerrarAlocacoesManuaisDeDiasAnteriores } = require("../services/mapaOperacional/viradaDiaOperacional.service");
const { sinergiasNoDestino } = require("../services/sinergiaInterna/localizacao.service");
const { FUNCOES } = require("../services/sinergiaInterna/base");

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
  APOIO: "Apoio",
  DOCK_RECEIVED: "Received",
  DOCK_PULL: "Pull",
  DOCK_CONFERENTE: "Conferente",
  DOCK_PUSH: "Push",
  DOCK_FIFO: "FIFO",
  DOCK_LOG_II: "LOG II",
  DOCK_VOLANTE: "Volante",
  FULL_D1: "FULL D+1",
};
const OPERACAO_LABEL = { INBOUND: "Recebimento", OUTBOUND: "Expedição" };

function descreverAlocacao(a) {
  if (a.labor === "FULL_D1") return { tipo: "FULL_D1", descricao: "FULL D+1" };

  if (a.numeroDoca != null) {
    const partes = [`Doca ${a.numeroDoca}`];
    if (a.operacaoDoca) partes.push(OPERACAO_LABEL[a.operacaoDoca]);
    if (LABOR_LABEL[a.labor]) partes.push(LABOR_LABEL[a.labor]);
    return { tipo: "DOCA", descricao: partes.join(" · ") };
  }

  const esteira = a.esteira?.nome || "Esteira";
  if (a.braco != null && a.labor === "PESCA") return { tipo: "ESTEIRA", descricao: `${esteira} · Pesca · Braço ${a.braco}${a.lado}` };
  if (a.braco != null) return { tipo: "ESTEIRA", descricao: `${esteira} · Braço ${a.braco}${a.lado}` };
  return { tipo: "ESTEIRA", descricao: `${esteira} · ${LABOR_LABEL[a.labor] || a.labor}` };
}

/* =====================================================
   EFETIVO PRESENTE — quem está presente (P) no turno e onde está alocado
===================================================== */
const listarEfetivo = async (req, res) => {
  try {
    const idEstacao = req.dbContext?.estacaoId ?? 1;
    const { turno: turnoAtual, diaOperacional } = getTurnoOperacionalAtual();
    const turno = ["T1", "T2", "T3"].includes(req.query.turno) ? req.query.turno : turnoAtual;

    await encerrarAlocacoesManuaisDeDiasAnteriores(idEstacao);

    const colaboradores = await prisma.colaborador.findMany({
      where: {
        idEstacao,
        status: "ATIVO",
        turno: { nomeTurno: turno },
        cargo: FILTRO_CARGO_PRISMA,
        frequencias: { some: { dataReferencia: diaOperacional, idTipoAusencia: 2 } },
      },
      select: {
        opsId: true,
        nomeCompleto: true,
        cargo: { select: { nomeCargo: true } },
        setor: { select: { nomeSetor: true } },
      },
      orderBy: { nomeCompleto: "asc" },
    });

    const opsIds = colaboradores.map((c) => c.opsId);
    const emSinergia = await sinergiasNoDestino(opsIds);

    const [diretas, alocacoesDeTime] = await Promise.all([
      prisma.mapaAlocacao.findMany({
        where: { idEstacao, fim: null, opsId: { in: opsIds } },
        include: { esteira: { select: { nome: true } } },
      }),
      prisma.mapaAlocacao.findMany({
        where: { idEstacao, fim: null, idTime: { not: null } },
        include: { time: { include: { integrantes: { select: { opsId: true } } } } },
      }),
    ]);

    const porOps = new Map();
    diretas.forEach((a) => {
      porOps.set(a.opsId, {
        ...descreverAlocacao(a),
        origem: a.origem,
        idAlocacao: a.idAlocacao,
        inicio: formatDataHora(a.inicio),
      });
    });
    // Integrante de time alocado numa doca também está alocado (via o time).
    alocacoesDeTime.forEach((a) => {
      a.time.integrantes.forEach((i) => {
        if (porOps.has(i.opsId)) return;
        porOps.set(i.opsId, {
          tipo: "DOCA",
          descricao: `Doca ${a.numeroDoca} · ${OPERACAO_LABEL[a.operacaoDoca]} · Time ${a.time.nome}`,
          origem: "MANUAL",
          idAlocacao: a.idAlocacao,
          inicio: formatDataHora(a.inicio),
        });
      });
    });

    const efetivo = colaboradores.map((c) => {
      const sinergia = emSinergia.get(c.opsId) || null;
      return {
        opsId: c.opsId,
        nomeCompleto: c.nomeCompleto,
        cargo: c.cargo?.nomeCargo || null,
        setor: c.setor?.nomeSetor || null,
        // Em sinergia interna confirmada, as opções de alocação são as do destino (setor base intacto).
        contexto: sinergia ? sinergia.areaDestino.contexto : contextoDoSetor(c.setor?.nomeSetor),
        sinergia: sinergia
          ? {
              origem: sinergia.areaOrigem.nome,
              destino: sinergia.areaDestino.nome,
              status: sinergia.status,
              funcaoDestino: sinergia.funcaoDestino,
              funcao: sinergia.funcaoDestino ? FUNCOES[sinergia.funcaoDestino] || sinergia.funcaoDestino : null,
              retornoPendente: sinergia.status === "AGUARDANDO_RETORNO",
            }
          : null,
        alocacao: porOps.get(c.opsId) || null,
      };
    });

    return successResponse(res, {
      turno,
      total: efetivo.length,
      alocados: efetivo.filter((e) => e.alocacao).length,
      naoAlocados: efetivo.filter((e) => !e.alocacao).length,
      efetivo,
    });
  } catch (err) {
    console.error("❌ Erro ao listar efetivo:", err);
    return errorResponse(res, "Erro ao listar efetivo", 500);
  }
};

module.exports = { listarEfetivo };
