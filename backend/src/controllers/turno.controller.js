const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse, paginatedResponse } = require('../utils/response');

const getAllTurnos = async (req, res) => {
  const isGlobal = req.dbContext?.isGlobal ?? false;
  const estacaoId = (!isGlobal && req.dbContext?.estacaoId) ? req.dbContext.estacaoId : null;

  const where = {};
  if (estacaoId) {
    where.OR = [{ idEstacao: estacaoId }, { idEstacao: null }];
  }

  const colaboradoresWhere = {
    status: 'ATIVO',
    ...(estacaoId ? { idEstacao: estacaoId } : {}),
  };

  const turnos = await prisma.turno.findMany({
    where,
    orderBy: { nomeTurno: 'asc' },
    include: {
      estacao: { select: { idEstacao: true, nomeEstacao: true } },
      _count: {
        select: {
          colaboradores: { where: colaboradoresWhere },
        },
      },
    },
  });
  return successResponse(res, turnos);
};

const getTurnoById = async (req, res) => {
  const turno = await prisma.turno.findUnique({ where: { idTurno: parseInt(req.params.id) } });
  if (!turno) return notFoundResponse(res, 'Turno não encontrado');
  return successResponse(res, turno);
};

const createTurno = async (req, res) => {
  const { nomeTurno, horarioInicio, horarioFim } = req.body;

  const idEstacao = req.body.idEstacao
    ? Number(req.body.idEstacao)
    : (req.dbContext?.estacaoId ?? null);

  const turno = await prisma.turno.create({
    data: {
      nomeTurno,
      horarioInicio: new Date(`1970-01-01T${horarioInicio}:00.000Z`),
      horarioFim: new Date(`1970-01-01T${horarioFim}:00.000Z`),
      ...(idEstacao ? { idEstacao } : {}),
    },
  });
  return createdResponse(res, turno);
};

const updateTurno = async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const userEstacaoId = req.user?.idEstacao ?? null;

  const turno = await prisma.turno.findUnique({
    where: { idTurno: parseInt(req.params.id) },
    select: { idEstacao: true },
  });

  if (!turno) return notFoundResponse(res, 'Turno não encontrado');

  if (!isAdmin) {
    if (!turno.idEstacao || turno.idEstacao !== userEstacaoId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para editar este turno.' });
    }
  }

  const updateData = {};
  if (req.body.nomeTurno) updateData.nomeTurno = req.body.nomeTurno;
  if (req.body.horarioInicio) updateData.horarioInicio = new Date(`1970-01-01T${req.body.horarioInicio}:00.000Z`);
  if (req.body.horarioFim) updateData.horarioFim = new Date(`1970-01-01T${req.body.horarioFim}:00.000Z`);
  if (req.body.ativo !== undefined) updateData.ativo = req.body.ativo;

  const updated = await prisma.turno.update({ where: { idTurno: parseInt(req.params.id) }, data: updateData });
  return successResponse(res, updated);
};

const deleteTurno = async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const userEstacaoId = req.user?.idEstacao ?? null;

  const turno = await prisma.turno.findUnique({
    where: { idTurno: parseInt(req.params.id) },
    select: { idEstacao: true },
  });

  if (!turno) return notFoundResponse(res, 'Turno não encontrado');

  if (!isAdmin) {
    if (!turno.idEstacao || turno.idEstacao !== userEstacaoId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para excluir este turno.' });
    }
  }

  const total = await prisma.colaborador.count({ where: { idTurno: parseInt(req.params.id) } });
  if (total > 0) {
    return res.status(409).json({
      success: false,
      message: `Não é possível excluir este turno pois ele possui ${total} colaborador(es) vinculado(s).`,
    });
  }
  await prisma.turno.delete({ where: { idTurno: parseInt(req.params.id) } });
  return deletedResponse(res);
};

module.exports = { getAllTurnos, getTurnoById, createTurno, updateTurno, deleteTurno };
