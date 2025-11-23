const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse } = require('../utils/response');

const getAllContratos = async (req, res) => {
  const contratos = await prisma.contrato.findMany({
    where: { ativo: true },
    include: { empresa: { select: { razaoSocial: true } } },
    orderBy: { nomeContrato: 'asc' },
  });
  return successResponse(res, contratos);
};

const getContratoById = async (req, res) => {
  const contrato = await prisma.contrato.findUnique({
    where: { idContrato: parseInt(req.params.id) },
    include: { empresa: true },
  });
  if (!contrato) return notFoundResponse(res, 'Contrato não encontrado');
  return successResponse(res, contrato);
};

const createContrato = async (req, res) => {
  const { nomeContrato, idEmpresa, dataInicio, dataFim } = req.body;
  const contrato = await prisma.contrato.create({
    data: {
      nomeContrato,
      idEmpresa: idEmpresa ? parseInt(idEmpresa) : null,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      dataFim: dataFim ? new Date(dataFim) : null,
    },
  });
  return createdResponse(res, contrato);
};

const updateContrato = async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.dataInicio) updateData.dataInicio = new Date(updateData.dataInicio);
  if (updateData.dataFim) updateData.dataFim = new Date(updateData.dataFim);
  if (updateData.idEmpresa) updateData.idEmpresa = parseInt(updateData.idEmpresa);

  const contrato = await prisma.contrato.update({ where: { idContrato: parseInt(req.params.id) }, data: updateData });
  return successResponse(res, contrato);
};

const deleteContrato = async (req, res) => {
  await prisma.contrato.delete({ where: { idContrato: parseInt(req.params.id) } });
  return deletedResponse(res);
};

module.exports = { getAllContratos, getContratoById, createContrato, updateContrato, deleteContrato };
