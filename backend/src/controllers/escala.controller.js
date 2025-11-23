const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse } = require('../utils/response');

const getAllEscalas = async (req, res) => {
  const escalas = await prisma.escala.findMany({ where: { ativo: true }, orderBy: { nomeEscala: 'asc' } });
  return successResponse(res, escalas);
};

const getEscalaById = async (req, res) => {
  const escala = await prisma.escala.findUnique({ where: { idEscala: parseInt(req.params.id) } });
  if (!escala) return notFoundResponse(res, 'Escala não encontrada');
  return successResponse(res, escala);
};

const createEscala = async (req, res) => {
  const escala = await prisma.escala.create({ data: req.body });
  return createdResponse(res, escala);
};

const updateEscala = async (req, res) => {
  const escala = await prisma.escala.update({ where: { idEscala: parseInt(req.params.id) }, data: req.body });
  return successResponse(res, escala);
};

const deleteEscala = async (req, res) => {
  await prisma.escala.delete({ where: { idEscala: parseInt(req.params.id) } });
  return deletedResponse(res);
};

module.exports = { getAllEscalas, getEscalaById, createEscala, updateEscala, deleteEscala };
