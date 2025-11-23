/**
 * Controller de Frequência
 * Gerencia registro de ponto e frequência diária
 */

const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse, paginatedResponse } = require('../utils/response');

const getAllFrequencias = async (req, res) => {
  const { page = 1, limit = 10, opsId, dataInicio, dataFim, idTipoAusencia } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};
  if (opsId) where.opsId = opsId;
  if (idTipoAusencia) where.idTipoAusencia = parseInt(idTipoAusencia);
  if (dataInicio || dataFim) {
    where.dataReferencia = {};
    if (dataInicio) where.dataReferencia.gte = new Date(dataInicio);
    if (dataFim) where.dataReferencia.lte = new Date(dataFim);
  }

  const [frequencias, total] = await Promise.all([
    prisma.frequencia.findMany({
      where,
      skip,
      take,
      orderBy: { dataReferencia: 'desc' },
      include: {
        colaborador: { select: { opsId: true, nomeCompleto: true, matricula: true } },
        tipoAusencia: true,
      },
    }),
    prisma.frequencia.count({ where }),
  ]);

  return paginatedResponse(res, frequencias, { page: parseInt(page), limit: parseInt(limit), total });
};

const getFrequenciaById = async (req, res) => {
  const { id } = req.params;

  const frequencia = await prisma.frequencia.findUnique({
    where: { idFrequencia: parseInt(id) },
    include: {
      colaborador: { select: { opsId: true, nomeCompleto: true, matricula: true, setor: true, cargo: true } },
      tipoAusencia: true,
    },
  });

  if (!frequencia) return notFoundResponse(res, 'Registro de frequência não encontrado');
  return successResponse(res, frequencia);
};

const createFrequencia = async (req, res) => {
  const { opsId, dataReferencia, idTipoAusencia, horaEntrada, horaSaida, horasTrabalhadas, observacao, justificativa, documentoAnexo } = req.body;

  const frequencia = await prisma.frequencia.create({
    data: {
      opsId,
      dataReferencia: new Date(dataReferencia),
      idTipoAusencia: idTipoAusencia ? parseInt(idTipoAusencia) : null,
      horaEntrada: horaEntrada ? new Date(`1970-01-01T${horaEntrada}`) : null,
      horaSaida: horaSaida ? new Date(`1970-01-01T${horaSaida}`) : null,
      horasTrabalhadas: horasTrabalhadas ? parseFloat(horasTrabalhadas) : null,
      observacao,
      justificativa,
      documentoAnexo,
      registradoPor: req.user?.id || 'sistema',
    },
    include: {
      colaborador: { select: { nomeCompleto: true } },
      tipoAusencia: true,
    },
  });

  return createdResponse(res, frequencia, 'Frequência registrada com sucesso');
};

const updateFrequencia = async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.dataReferencia) updateData.dataReferencia = new Date(updateData.dataReferencia);
  if (updateData.horaEntrada) updateData.horaEntrada = new Date(`1970-01-01T${updateData.horaEntrada}`);
  if (updateData.horaSaida) updateData.horaSaida = new Date(`1970-01-01T${updateData.horaSaida}`);
  if (updateData.horasTrabalhadas) updateData.horasTrabalhadas = parseFloat(updateData.horasTrabalhadas);
  if (updateData.idTipoAusencia) updateData.idTipoAusencia = parseInt(updateData.idTipoAusencia);

  const frequencia = await prisma.frequencia.update({
    where: { idFrequencia: parseInt(id) },
    data: updateData,
    include: { colaborador: true, tipoAusencia: true },
  });

  return successResponse(res, frequencia, 'Frequência atualizada com sucesso');
};

const deleteFrequencia = async (req, res) => {
  const { id } = req.params;
  await prisma.frequencia.delete({ where: { idFrequencia: parseInt(id) } });
  return deletedResponse(res, 'Frequência excluída com sucesso');
};

const validarFrequencia = async (req, res) => {
  const { id } = req.params;

  const frequencia = await prisma.frequencia.update({
    where: { idFrequencia: parseInt(id) },
    data: {
      validado: true,
      validadoPor: req.user?.id || 'admin',
      dataValidacao: new Date(),
    },
  });

  return successResponse(res, frequencia, 'Frequência validada com sucesso');
};

module.exports = {
  getAllFrequencias,
  getFrequenciaById,
  createFrequencia,
  updateFrequencia,
  deleteFrequencia,
  validarFrequencia,
};
