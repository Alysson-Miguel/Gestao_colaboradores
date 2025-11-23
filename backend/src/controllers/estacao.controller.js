const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse } = require('../utils/response');

const getAllEstacoes = async (req, res) => {
  const estacoes = await prisma.estacao.findMany({ where: { ativo: true }, orderBy: { nomeEstacao: 'asc' } });
  return successResponse(res, estacoes);
};

const getEstacaoById = async (req, res) => {
  const estacao = await prisma.estacao.findUnique({ where: { idEstacao: parseInt(req.params.id) } });
  if (!estacao) return notFoundResponse(res, 'Estação não encontrada');
  return successResponse(res, estacao);
};

const createEstacao = async (req, res) => {
  const estacao = await prisma.estacao.create({ data: req.body });
  return createdResponse(res, estacao);
};

const updateEstacao = async (req, res) => {
  const estacao = await prisma.estacao.update({ where: { idEstacao: parseInt(req.params.id) }, data: req.body });
  return successResponse(res, estacao);
};

const deleteEstacao = async (req, res) => {
  await prisma.estacao.delete({ where: { idEstacao: parseInt(req.params.id) } });
  return deletedResponse(res);
};

module.exports = { getAllEstacoes, getEstacaoById, createEstacao, updateEstacao, deleteEstacao };
