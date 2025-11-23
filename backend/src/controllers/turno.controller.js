const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse, paginatedResponse } = require('../utils/response');

const getAllTurnos = async (req, res) => {
  const turnos = await prisma.turno.findMany({ where: { ativo: true }, orderBy: { nomeTurno: 'asc' } });
  return successResponse(res, turnos);
};

const getTurnoById = async (req, res) => {
  const turno = await prisma.turno.findUnique({ where: { idTurno: parseInt(req.params.id) } });
  if (!turno) return notFoundResponse(res, 'Turno não encontrado');
  return successResponse(res, turno);
};

const createTurno = async (req, res) => {
  const { nomeTurno, horarioInicio, horarioFim, cargaHorariaDiaria } = req.body;
  const turno = await prisma.turno.create({
    data: {
      nomeTurno,
      horarioInicio: new Date(`1970-01-01T${horarioInicio}`),
      horarioFim: new Date(`1970-01-01T${horarioFim}`),
      cargaHorariaDiaria: cargaHorariaDiaria ? parseFloat(cargaHorariaDiaria) : null,
    },
  });
  return createdResponse(res, turno);
};

const updateTurno = async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.horarioInicio) updateData.horarioInicio = new Date(`1970-01-01T${updateData.horarioInicio}`);
  if (updateData.horarioFim) updateData.horarioFim = new Date(`1970-01-01T${updateData.horarioFim}`);
  if (updateData.cargaHorariaDiaria) updateData.cargaHorariaDiaria = parseFloat(updateData.cargaHorariaDiaria);

  const turno = await prisma.turno.update({ where: { idTurno: parseInt(req.params.id) }, data: updateData });
  return successResponse(res, turno);
};

const deleteTurno = async (req, res) => {
  await prisma.turno.delete({ where: { idTurno: parseInt(req.params.id) } });
  return deletedResponse(res);
};

module.exports = { getAllTurnos, getTurnoById, createTurno, updateTurno, deleteTurno };
