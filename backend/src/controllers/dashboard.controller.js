const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =====================================================
   DIA OPERACIONAL (cutoff 05:25)
===================================================== */
function getDiaOperacionalRef(baseDate = new Date()) {
  const d = new Date(baseDate);
  const beforeCutoff =
    d.getHours() < 5 || (d.getHours() === 5 && d.getMinutes() < 25);

  if (beforeCutoff) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* =====================================================
   TURNO ATUAL (prioridade T3 > T2 > T1)
===================================================== */
function getTurnoAtual(baseDate = new Date()) {
  const t = baseDate.getHours() * 60 + baseDate.getMinutes();
  const inRange = (s, e) => (s <= e ? t >= s && t <= e : t >= s || t <= e);

  if (inRange(21 * 60, 5 * 60 + 48)) return "T3";
  if (inRange(13 * 60 + 20, 23 * 60)) return "T2";
  if (inRange(5 * 60 + 25, 15 * 60 + 5)) return "T1";
  return "T1";
}

/* =====================================================
   HELPERS
===================================================== */
const normalize = (v) => String(v || "").trim();

const normalizeTurno = (t) => {
  const v = normalize(t).toUpperCase();
  if (v.includes("T1")) return "T1";
  if (v.includes("T2")) return "T2";
  if (v.includes("T3")) return "T3";
  return "Sem turno";
};

function getStatusDoDia(registro) {
  if (registro?.horaEntrada)
    return { status: "PRESENTE", origem: "horaEntrada" };

  if (registro?.idTipoAusencia)
    return {
      status: normalize(registro.tipoAusencia?.descricao || "AUSÊNCIA"),
      origem: "tipoAusencia",
    };

  return { status: "FALTA", origem: "semRegistro" };
}

function getCategoria(status, origem) {
  const s = status.toUpperCase();
  if (origem === "semRegistro") return "ausencia";
  if (s.includes("ATESTADO")) return "atestado";
  if (s.includes("ACIDENT")) return "acidente";
  if (s.includes("FERIA")) return "ferias";
  if (s.includes("DISCIPLIN")) return "disciplinar";
  return "ausencia";
}

function getCriticidade(categoria, origem) {
  if (categoria === "acidente" || origem === "semRegistro") return "alta";
  if (categoria === "disciplinar") return "media";
  return "baixa";
}

function getSetor(registro, colaborador) {
  return (
    normalize(registro?.setor?.nomeSetor) ||
    normalize(colaborador?.setor?.nomeSetor) ||
    "Sem setor"
  );
}

const initTurnoMap = () => ({
  T1: {},
  T2: {},
  T3: {},
  "Sem turno": {},
});

/* =====================================================
   CONTROLLER
===================================================== */
const carregarDashboard = async (req, res) => {
  try {
    const agora = new Date();
    const dataOperacional = getDiaOperacionalRef(agora);
    const turnoAtual = getTurnoAtual(agora);

    const [colaboradores, empresas, turnos, escalasAtivas, frequenciasHoje] =
      await Promise.all([
        prisma.colaborador.findMany({
          include: { empresa: true, turno: true, setor: true },
        }),
        prisma.empresa.findMany(),
        prisma.turno.findMany(),
        prisma.escala.findMany({ where: { ativo: true } }),
        prisma.frequencia.findMany({
          where: { dataReferencia: dataOperacional },
          include: {
            colaborador: { include: { turno: true, setor: true } },
            tipoAusencia: true,
            setor: true,
          },
        }),
      ]);

    const freqMap = new Map(
      frequenciasHoje.map((f) => [f.opsId, f])
    );

    const turnoSetorAgg = {};
    const generoPorTurno = initTurnoMap();
    const statusPorTurno = initTurnoMap();
    const empresaPorTurno = initTurnoMap();
    const ausenciasHoje = [];

    colaboradores.forEach((c) => {
      const registro = freqMap.get(c.opsId);
      const turno = normalizeTurno(c.turno?.nomeTurno);
      const genero = normalize(c.genero) || "N/I";
      const empresa = normalize(c.empresa?.razaoSocial) || "Sem empresa";

      /* ===== GÊNERO (ESCALADOS) ===== */
      generoPorTurno[turno][genero] =
        (generoPorTurno[turno][genero] || 0) + 1;

      /* ===== EMPRESA (ESCALADOS) ===== */
      empresaPorTurno[turno][empresa] =
        (empresaPorTurno[turno][empresa] || 0) + 1;

      /* ===== TURNO BASE ===== */
      if (!turnoSetorAgg[turno]) {
        turnoSetorAgg[turno] = {
          turno,
          totalEscalados: 0,
          presentes: 0,
          ausentes: 0,
          setores: {},
        };
      }

      turnoSetorAgg[turno].totalEscalados++;

      /* ===== SETOR (ESCALADOS) ===== */
      const setor = getSetor(registro, c);
      turnoSetorAgg[turno].setores[setor] =
        (turnoSetorAgg[turno].setores[setor] || 0) + 1;

      /* ===== STATUS ===== */
      const { status, origem } = getStatusDoDia(registro);
      statusPorTurno[turno][status] =
        (statusPorTurno[turno][status] || 0) + 1;

      if (status === "PRESENTE") {
        turnoSetorAgg[turno].presentes++;
      } else {
        turnoSetorAgg[turno].ausentes++;
        ausenciasHoje.push({
          colaboradorId: c.opsId,
          nome: c.nomeCompleto,
          turno,
          motivo: status,
          origem,
          categoria: getCategoria(status, origem),
          criticidade: getCriticidade(
            getCategoria(status, origem),
            origem
          ),
        });
      }
    });

    return res.json({
      success: true,
      data: {
        dataOperacional,
        turnoAtual,

        distribuicaoTurnoSetor: Object.values(turnoSetorAgg).map((t) => ({
          ...t,
          setores: Object.entries(t.setores).map(
            ([setor, quantidade]) => ({ setor, quantidade })
          ),
        })),

        generoPorTurno: Object.fromEntries(
          Object.entries(generoPorTurno).map(([t, g]) => [
            t,
            Object.entries(g).map(([name, value]) => ({ name, value })),
          ])
        ),

        statusColaboradoresPorTurno: Object.fromEntries(
          Object.entries(statusPorTurno).map(([t, s]) => [
            t,
            Object.entries(s).map(([status, quantidade]) => ({
              status,
              quantidade,
            })),
          ])
        ),

        empresaPorTurno: Object.fromEntries(
          Object.entries(empresaPorTurno).map(([t, e]) => [
            t,
            Object.entries(e).map(([empresa, quantidade]) => ({
              empresa,
              quantidade,
            })),
          ])
        ),

        ausenciasHoje,

        empresas: empresas.map((e) => ({
          id: e.idEmpresa,
          nome: e.razaoSocial,
        })),

        turnos: turnos.map((t) => ({
          id: t.idTurno,
          nome: t.nomeTurno,
        })),

        escalasAtivas: escalasAtivas.map((e) => ({
          id: e.idEscala,
          nome: e.nomeEscala,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Erro dashboard:", error);
    res.status(500).json({ success: false });
  }
};

module.exports = { carregarDashboard };
