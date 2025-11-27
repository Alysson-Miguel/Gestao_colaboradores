const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", authenticate, async (req, res) => {
  try {
    console.log("📊 Carregando dashboard para usuário:", req.user?.name);

    // ----------------- DATAS -----------------
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ----------------- BUSCAS -----------------
    const [
      colaboradores,
      empresas,
      turnos,
      escalasAtivas,
      ausenciasHoje
    ] = await Promise.all([
      prisma.colaborador.findMany({
        include: {
          empresa: true,
          turno: true,
        },
      }),
      prisma.empresa.findMany(),
      prisma.turno.findMany(),
      prisma.escala.findMany({ where: { ativo: true } }),
      prisma.ausencia.findMany({
        where: {
          dataInicio: { lte: todayEnd },
          dataFim: { gte: todayStart },
        },
        include: {
          colaborador: true,
        },
      }),
    ]);

    // DEBUG: Logs para ver dados crus
    console.log("🔍 Colaboradores crus:", colaboradores.map(c => ({ id: c.id, nomeCompleto: c.nomeCompleto, turno: c.turno?.nomeTurno, empresa: c.empresa?.razaoSocial })));
    console.log("🔍 Empresas cruas:", empresas.map(e => ({ id: e.id, razaoSocial: e.razaoSocial })));
    console.log("🔍 Turnos crus:", turnos.map(t => ({ id: t.id, nomeTurno: t.nomeTurno })));
    console.log("🔍 Ausências hoje:", ausenciasHoje.length);

    // ----------------- FORMATA AUSÊNCIAS -----------------
    const ausenciasFormatadas = ausenciasHoje.map(a => ({
      id: a.id,
      nome: a.colaborador?.nomeCompleto || "Desconhecido",
      motivo: a.motivo || "Não informado",
    }));

    // ----------------- CONTAGENS -----------------
    const totalColaboradores = colaboradores.length;
    const totalTurnos = turnos.length;
    const totalEmpresas = empresas.length;
    const totalEscalasAtivas = escalasAtivas.length;

    console.log("✅ Dashboard carregado com sucesso. Totais:", { totalColaboradores, totalEmpresas, totalTurnos });

    return res.json({
      success: true,
      data: {
        colaboradores: colaboradores.map(c => ({
          id: c.id,
          nome: c.nomeCompleto || "Sem Nome",
          horarioEntrada: c.horarioInicioJornada,
          status: c.status,
          genero: c.genero,
          empresa: c.empresa?.razaoSocial || "Sem Empresa",
          turno: c.turno?.nomeTurno || "Sem Turno",
        })),
        empresas: empresas.map(e => ({ id: e.id, nome: e.razaoSocial })),
        turnos: turnos.map(t => ({ id: t.id, nome: t.nomeTurno })),
        escalasAtivas: escalasAtivas.map(e => ({ id: e.id, nome: e.nomeEscala })),
        ausenciasHoje: ausenciasFormatadas,
        totalColaboradores,
        totalTurnos,
        totalEmpresas,
        totalEscalasAtivas,
      },
    });

  } catch (error) {
    console.error("❌ Erro ao carregar dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao carregar dashboard",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ← ESSA LINHA É CRUCIAL: Exporta o ROUTER, não um objeto genérico
module.exports = router;