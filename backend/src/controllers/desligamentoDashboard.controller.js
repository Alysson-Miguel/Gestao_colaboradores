const { getDesligamentosDashboard } = require("../services/desligamentoDashboard.service");
const { buildDesligamentoDashboard } = require("../utils/buildDesligamentoDashboard");
const { prisma } = require("../config/database");

const dashboardDesligamento = async (req, res) => {
  try {
    let {
      inicio,
      fim,
      empresa,
      turno,
      setor,
      lider,
    } = req.query;

    /* =====================================================
       VALIDAÇÃO DE DATAS
    ===================================================== */
    if (!inicio || !fim) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros 'inicio' e 'fim' são obrigatórios",
      });
    }

    /* =====================================================
       NORMALIZAÇÃO DOS FILTROS
    ===================================================== */
    const estacaoId = (!req.dbContext?.isGlobal && req.dbContext?.estacaoId) ? req.dbContext.estacaoId : null;

    const filtros = {
      inicio,
      fim,
      empresa: empresa || undefined,
      setor: setor || undefined,
      lider: lider || undefined,
      turno:
        !turno || turno === "ALL" ? undefined : turno,
      estacaoId: estacaoId || undefined,
    };

    /* =====================================================
       FETCH DATA
    ===================================================== */
    const data = await getDesligamentosDashboard(filtros);

    /* =====================================================
       BUILD DASHBOARD
    ===================================================== */
    const resumo = buildDesligamentoDashboard(data);

    /* =====================================================
       RESPONSE
    ===================================================== */
    return res.json({
      success: true,
      periodo: {
        inicio,
        fim,
      },
      filtros: {
        ...filtros,
        turno: turno || "ALL",
      },
      data: resumo,
    });

  } catch (error) {
    console.error("❌ Erro dashboard desligamento:", error);

    return res.status(500).json({
      success: false,
      error: "Erro ao carregar dashboard de desligamento",
    });
  }
};

/* ================= UTILS ================= */
function formatTempoCasa(dias) {
  if (!dias || dias < 0) return "—";
  const anos = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  if (anos === 0 && meses === 0) return `${dias} dia${dias !== 1 ? "s" : ""}`;
  if (anos === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  if (meses === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
}

/* ================= DETALHADO ================= */
const getDesligamentosDetalhado = async (req, res) => {
  try {
    const {
      inicio, fim, empresa, turno, setor, lider,
      page = 1, limit = 50,
      search, sort = "nome", sortDir = "asc",
    } = req.query;

    if (!inicio || !fim) {
      return res.status(400).json({ success: false, error: "Parâmetros 'inicio' e 'fim' são obrigatórios" });
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const estacaoId = (!req.dbContext?.isGlobal && req.dbContext?.estacaoId)
      ? req.dbContext.estacaoId
      : null;

    const inicioDate = new Date(inicio);
    const fimDate    = new Date(new Date(fim).getTime() + 86400000);

    const where = {
      dataDesligamento: { not: null, gte: inicioDate, lt: fimDate },
    };

    if (estacaoId)            where.idEstacao = estacaoId;
    if (empresa)              where.idEmpresa = Number(empresa);
    if (setor)                where.idSetor   = Number(setor);
    if (lider)                where.idLider   = lider;
    if (turno && turno !== "ALL") {
      const turnoMap = { T1: 1, T2: 2, T3: 3 };
      const tid = turnoMap[turno];
      if (tid) where.idTurno = tid;
    }
    if (search) {
      where.nomeCompleto = { contains: search, mode: "insensitive" };
    }

    const colaboradores = await prisma.colaborador.findMany({
      where,
      include: {
        _count: {
          select: {
            atestadosMedicos: {
              where: { dataInicio: { gte: inicioDate, lt: fimDate } },
            },
            ausencias: {
              where: { dataInicio: { gte: inicioDate, lt: fimDate } },
            },
          },
        },
        empresa: { select: { razaoSocial: true } },
        setor:   { select: { nomeSetor: true } },
        turno:   { select: { nomeTurno: true } },
        escala:  { select: { nomeEscala: true } },
      },
    });

    const RECORRENTE_FALTAS     = 3;
    const RECORRENTE_ATESTADOS  = 2;

    const items = colaboradores.map((c) => {
      const admissao     = c.dataAdmissao     ? new Date(c.dataAdmissao)     : null;
      const desligamento = c.dataDesligamento ? new Date(c.dataDesligamento) : null;
      let diasCasa = 0;
      if (admissao && desligamento) {
        diasCasa = Math.max(0, Math.floor((desligamento - admissao) / 86400000));
      }

      const faltas    = c._count.ausencias;
      const atestados = c._count.atestadosMedicos;
      const recorrente = faltas >= RECORRENTE_FALTAS || atestados >= RECORRENTE_ATESTADOS;

      return {
        opsId:            c.opsId,
        nome:             c.nomeCompleto,
        empresa:          c.empresa?.razaoSocial || "—",
        setor:            c.setor?.nomeSetor     || "—",
        turno:            c.turno?.nomeTurno     || "—",
        escala:           c.escala?.nomeEscala   || "—",
        diasCasa,
        tempoCasa:        formatTempoCasa(diasCasa),
        faltas,
        atestados,
        recorrente,
        dataAdmissao:     c.dataAdmissao,
        dataDesligamento: c.dataDesligamento,
      };
    });

    /* sort */
    const dir = sortDir === "desc" ? -1 : 1;
    items.sort((a, b) => {
      switch (sort) {
        case "tempoCasa": return dir * (a.diasCasa  - b.diasCasa);
        case "faltas":    return dir * (a.faltas    - b.faltas);
        case "atestados": return dir * (a.atestados - b.atestados);
        default:          return dir * a.nome.localeCompare(b.nome, "pt-BR");
      }
    });

    /* paginate */
    const total  = items.length;
    const skip   = (pageNum - 1) * limitNum;
    const paged  = items.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      data: paged,
      pagination: {
        page:            pageNum,
        limit:           limitNum,
        total,
        totalPages:      Math.ceil(total / limitNum),
        hasNextPage:     skip + limitNum < total,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (err) {
    console.error("❌ GET DESLIGAMENTOS DETALHADO:", err);
    return res.status(500).json({ success: false, error: "Erro ao buscar detalhamento" });
  }
};

module.exports = {
  dashboardDesligamento,
  getDesligamentosDetalhado,
};