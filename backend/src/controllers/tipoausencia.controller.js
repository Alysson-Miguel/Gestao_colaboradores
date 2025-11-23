/**
 * Controller de Tipo de Ausência
 */

const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse } = require('../utils/response');

const getAllTiposAusencia = async (req, res) => {
  const { ativo } = req.query;
  const where = {};
  if (ativo !== undefined) where.ativo = ativo === 'true';

  const tipos = await prisma.tipoAusencia.findMany({
    where,
    orderBy: { codigo: 'asc' },
  });

  return successResponse(res, tipos);
};

const getTipoAusenciaById = async (req, res) => {
  const { id } = req.params;
  const tipo = await prisma.tipoAusencia.findUnique({
    where: { idTipoAusencia: parseInt(id) },
  });

  if (!tipo) return notFoundResponse(res, 'Tipo de ausência não encontrado');
  return successResponse(res, tipo);
};

const createTipoAusencia = async (req, res) => {
  const { codigo, descricao, impactaAbsenteismo, justificada, requerDocumento, ativo } = req.body;

  const tipo = await prisma.tipoAusencia.create({
    data: { codigo, descricao, impactaAbsenteismo, justificada, requerDocumento, ativo },
  });

  return createdResponse(res, tipo, 'Tipo de ausência criado com sucesso');
};

const updateTipoAusencia = async (req, res) => {
  const { id } = req.params;

  const tipo = await prisma.tipoAusencia.update({
    where: { idTipoAusencia: parseInt(id) },
    data: req.body,
  });

  return successResponse(res, tipo, 'Tipo de ausência atualizado com sucesso');
};

const deleteTipoAusencia = async (req, res) => {
  const { id } = req.params;
  await prisma.tipoAusencia.delete({ where: { idTipoAusencia: parseInt(id) } });
  return deletedResponse(res, 'Tipo de ausência excluído com sucesso');
};

module.exports = {
  getAllTiposAusencia,
  getTipoAusenciaById,
  createTipoAusencia,
  updateTipoAusencia,
  deleteTipoAusencia,
};
