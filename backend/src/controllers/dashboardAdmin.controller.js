const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getPeriodoFiltro } = require("../utils/dateRange");

/* =====================================================
   HELPERS
===================================================== */
const normalize = (v) => String(v || "").trim();

const isoDate = (d) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

const daysInclusive = (inicio, fim) => {
  const a = new Date(inicio);
  const b = new Date(fim);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((b - a) / 86400000) + 1;
};

/* =====================================================
   STATUS DO DIA
===================================================== */
function getStatusDoDia(f) {
  if (f?.horaEntrada) {
    return { code: "P", impactaAbsenteismo: false };
  }

  if (f?.tipoAusencia) {
    return {
      code: f.tipoAusencia.codigo,
      impactaAbsenteismo: Boolean(
        f.tipoAusencia.impactaAbsenteismo
      ),
    };
  }

  return { code: "F", impactaAbsenteismo: true };
}

/* =====================================================
   BUILDERS
===================================================== */

/* ---------- GÊNERO ---------- */
function buildGenero(colaboradores) {
  const map = {};
  colaboradores.forEach((c) => {
    const g = normalize(c.genero) || "N/I";
    map[g] = (map[g] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

/* ---------- STATUS ---------- */
function buildStatus(frequencias) {
  const map = {};
  frequencias.forEach((f) => {
    const s = getStatusDoDia(f);
    map[s.code] = (map[s.code] || 0) + 1;
  });

  return Object.entries(map).map(([code, quantidade]) => ({
    code,
    label:
      code === "P"
        ? "Presente"
        : code === "F"
        ? "Falta"
        : code,
    quantidade,
  }));
}

/* ---------- OVERVIEW ---------- */
function buildOverview({ colaboradores, frequencias, inicio, fim }) {
  const totalColaboradores = colaboradores.length;
  const diasPeriodo = Math.max(0, daysInclusive(inicio, fim));
  const diasEsperados = totalColaboradores * diasPeriodo;

  let diasAbsenteismo = 0;
  const presentesSet = new Set();

  frequencias.forEach((f) => {
    const s = getStatusDoDia(f);
    if (s.impactaAbsenteismo) diasAbsenteismo++;
    if (s.code === "P") presentesSet.add(f.opsId);
  });

  return {
    totalColaboradores,
    presentes: presentesSet.size,
    absenteismo:
      diasEsperados > 0
        ? Number(((diasAbsenteismo / diasEsperados) * 100).toFixed(2))
        : 0,
  };
}

/* ---------- TURNOVER GLOBAL ---------- */
function buildTurnoverGlobal({ totalAtivosInicio, desligadosPeriodo }) {
  if (!totalAtivosInicio) return 0;
  return Number(
    ((desligadosPeriodo / totalAtivosInicio) * 100).toFixed(2)
  );
}

/* ---------- EVENTOS ---------- */
function buildEventos({ colaboradoresMap, atestados, acidentes, medidas }) {
  const eventos = [];

  atestados.forEach((a) => {
    const c = colaboradoresMap.get(a.opsId);
    eventos.push({
      id: `AT-${a.idAtestado}`,
      nome: c?.nomeCompleto || "-",
      empresa: c?.empresa?.razaoSocial || "-",
      setor: c?.setor?.nomeSetor || "-",
      evento: "Atestado",
      data: a.dataInicio,
    });
  });

  medidas.forEach((m) => {
    const c = colaboradoresMap.get(m.opsId);
    eventos.push({
      id: `MD-${m.idMedida}`,
      nome: c?.nomeCompleto || "-",
      empresa: c?.empresa?.razaoSocial || "-",
      setor: c?.setor?.nomeSetor || "-",
      evento: "Medida Disciplinar",
      data: m.dataAplicacao,
    });
  });

  acidentes.forEach((a) => {
    const c = colaboradoresMap.get(a.opsIdColaborador);
    eventos.push({
      id: `AC-${a.idAcidente}`,
      nome: c?.nomeCompleto || "-",
      empresa: c?.empresa?.razaoSocial || "-",
      setor: c?.setor?.nomeSetor || "-",
      evento: "Acidente",
      data: a.dataOcorrencia,
    });
  });

  return eventos.sort(
    (a, b) => new Date(b.data) - new Date(a.data)
  );
}

/* ---------- EMPRESAS RESUMO + TURNOVER + ABSENTEÍSMO ---------- */
function buildEmpresasResumo({
  colaboradores,
  colaboradoresMap,
  frequencias,
  atestados,
  medidas,
  acidentes,
  desligados,
  inicio,
  fim,
}) {
  const diasPeriodo = daysInclusive(inicio, fim);
  const map = {};

  /* ===============================
     BASE: COLABORADORES POR EMPRESA
  =============================== */
  colaboradores.forEach((c) => {
    const emp = c.empresa?.razaoSocial || "Sem empresa";

    if (!map[emp]) {
      map[emp] = {
        empresa: emp,
        totalColaboradores: 0,
        presentes: new Set(),
        absDias: 0,
        atestados: 0,
        medidasDisciplinares: 0,
        acidentes: 0,
        desligados: 0,
      };
    }

    map[emp].totalColaboradores++;
  });

  /* ===============================
     FREQUÊNCIAS (PRESENÇA / ABS)
  =============================== */
  frequencias.forEach((f) => {
    const c = colaboradoresMap.get(f.opsId);
    if (!c) return;

    const emp = c.empresa?.razaoSocial || "Sem empresa";
    const s = getStatusDoDia(f);

    if (s.code === "P") {
      map[emp].presentes.add(f.opsId);
    }

    if (s.impactaAbsenteismo) {
      map[emp].absDias++;
    }
  });

  /* ===============================
     EVENTOS
  =============================== */
  atestados.forEach((a) => {
    const c = colaboradoresMap.get(a.opsId);
    if (c) {
      map[c.empresa?.razaoSocial || "Sem empresa"].atestados++;
    }
  });

  medidas.forEach((m) => {
    const c = colaboradoresMap.get(m.opsId);
    if (c) {
      map[c.empresa?.razaoSocial || "Sem empresa"]
        .medidasDisciplinares++;
    }
  });

  acidentes.forEach((a) => {
    const c = colaboradoresMap.get(a.opsIdColaborador);
    if (c) {
      map[c.empresa?.razaoSocial || "Sem empresa"].acidentes++;
    }
  });

  desligados.forEach((c) => {
    const emp = c.empresa?.razaoSocial || "Sem empresa";
    if (map[emp]) {
      map[emp].desligados++;
    }
  });

  /* ===============================
     CÁLCULOS FINAIS
  =============================== */
  return Object.values(map).map((e) => {
    const diasEsperados = e.totalColaboradores * diasPeriodo;

    const absenteismo =
      diasEsperados > 0
        ? Number(((e.absDias / diasEsperados) * 100).toFixed(2))
        : 0;

    const turnover =
      e.totalColaboradores > 0
        ? Number(
            ((e.desligados / e.totalColaboradores) * 100).toFixed(2)
          )
        : 0;

    return {
      empresa: e.empresa,
      totalColaboradores: e.totalColaboradores,
      presentes: e.presentes.size,

      atestados: e.atestados,
      medidasDisciplinares: e.medidasDisciplinares,
      acidentes: e.acidentes,

      absenteismo,
      desligados: e.desligados,
      turnover,
    };
  });
}


/* =====================================================
   CONTROLLER — DASHBOARD ADMIN
===================================================== */
const carregarDashboardAdmin = async (req, res) => {
  try {
    const { inicio, fim } = getPeriodoFiltro(req.query);
    const { turno } = req.query;
    
    const colaboradores = await prisma.colaborador.findMany({
      where: {
        status: "ATIVO",
        ...(turno && turno !== "ALL" && {
          turno: {
            nomeTurno: turno,
          },
        }),
      },
      include: {
        empresa: true,
        setor: true,
        turno: true,
      },
    });


    const opsIds = colaboradores.map((c) => c.opsId);

    if (!opsIds.length) {
      return res.json({
        success: true,
        data: {
          periodo: { inicio: isoDate(inicio), fim: isoDate(fim) },
          totalColaboradores: 0,
          indicadores: {
            absenteismo: 0,
            presentes: 0,
            atestados: 0,
            medidasDisciplinares: 0,
            acidentes: 0,
            turnover: 0,
          },
          genero: [],
          status: [],
          eventos: [],
          empresasResumo: [],
        },
      });
    }

    const colaboradoresMap = new Map(
      colaboradores.map((c) => [c.opsId, c])
    );

    const frequencias = await prisma.frequencia.findMany({
      where: {
        opsId: { in: opsIds },
        dataReferencia: { gte: inicio, lte: fim },
      },
      include: { tipoAusencia: true },
    });

    const atestados = await prisma.atestadoMedico.findMany({
      where: {
        opsId: { in: opsIds },
        dataInicio: { lte: fim },
        dataFim: { gte: inicio },
      },
    });

    const medidas = await prisma.medidaDisciplinar.findMany({
      where: {
        opsId: { in: opsIds },
        dataAplicacao: { gte: inicio, lte: fim },
      },
    });

    const acidentes = await prisma.acidenteTrabalho.findMany({
      where: {
        opsIdColaborador: { in: opsIds },
        dataOcorrencia: { gte: inicio, lte: fim },
      },
    });

    const desligados = await prisma.colaborador.findMany({
      where: {
        status: "INATIVO",
        dataDesligamento: { gte: inicio, lte: fim },
      },
      include: { empresa: true },
    });

    const overview = buildOverview({
      colaboradores,
      frequencias,
      inicio,
      fim,
    });

    return res.json({
      success: true,
      data: {
        periodo: { inicio: isoDate(inicio), fim: isoDate(fim) },

        totalColaboradores: overview.totalColaboradores,

        indicadores: {
          absenteismo: overview.absenteismo,
          presentes: overview.presentes,
          atestados: atestados.length,
          medidasDisciplinares: medidas.length,
          acidentes: acidentes.length,
          turnover: buildTurnoverGlobal({
            totalAtivosInicio: overview.totalColaboradores,
            desligadosPeriodo: desligados.length,
          }),
        },

        genero: buildGenero(colaboradores),
        status: buildStatus(frequencias),

        eventos: buildEventos({
          colaboradoresMap,
          atestados,
          acidentes,
          medidas,
        }),

        empresasResumo: buildEmpresasResumo({
          colaboradores,
          colaboradoresMap,
          frequencias,
          atestados,
          medidas,
          acidentes,
          desligados,
          inicio,
          fim,
        }),
      },
    });
  } catch (error) {
    console.error("❌ Erro dashboard admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao carregar dashboard administrativo",
    });
  }
};

module.exports = { carregarDashboardAdmin };
