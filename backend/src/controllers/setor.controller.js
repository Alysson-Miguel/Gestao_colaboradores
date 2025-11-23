/**
 * Controller de Setor
 * Gerencia operações CRUD de setores
 */

const { prisma } = require('../config/database');
const {
  successResponse,
  createdResponse,
  deletedResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/response');

const getAllSetores = async (req, res) => {
  const { page = 1, limit = 10, search, ativo } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};
  if (search) {
    where.nomeSetor = { contains: search, mode: 'insensitive' };
  }
  if (ativo !== undefined) {
    where.ativo = ativo === 'true';
  }

  const [setores, total] = await Promise.all([
    prisma.setor.findMany({
      where,
      skip,
      take,
      orderBy: { nomeSetor: 'asc' },
      include: {
        _count: { select: { colaboradores: true } },
      },
    }),
    prisma.setor.count({ where }),
  ]);

  return paginatedResponse(res, setores, { page: parseInt(page), limit: parseInt(limit), total });
};

const getSetorById = async (req, res) => {
  const { id } = req.params;

  const setor = await prisma.setor.findUnique({
    where: { idSetor: parseInt(id) },
    include: {
      colaboradores: {
        where: { status: 'ATIVO' },
        select: {
          opsId: true,
          nomeCompleto: true,
          matricula: true,
          cargo: { select: { nomeCargo: true } },
        },
      },
      _count: { select: { colaboradores: true } },
    },
  });

  if (!setor) {
    return notFoundResponse(res, 'Setor não encontrado');
  }

  return successResponse(res, setor);
};

const createSetor = async (req, res) => {
  const { nomeSetor, descricao, ativo } = req.body;

  const setor = await prisma.setor.create({
    data: { nomeSetor, descricao, ativo: ativo !== undefined ? ativo : true },
  });

  return createdResponse(res, setor, 'Setor criado com sucesso');
};

const updateSetor = async (req, res) => {
  const { id } = req.params;
  const { nomeSetor, descricao, ativo } = req.body;

  const setor = await prisma.setor.update({
    where: { idSetor: parseInt(id) },
    data: {
      ...(nomeSetor && { nomeSetor }),
      ...(descricao !== undefined && { descricao }),
      ...(ativo !== undefined && { ativo }),
    },
  });

  return successResponse(res, setor, 'Setor atualizado com sucesso');
};

const deleteSetor = async (req, res) => {
  const { id } = req.params;

  await prisma.setor.delete({
    where: { idSetor: parseInt(id) },
  });

  return deletedResponse(res, 'Setor excluído com sucesso');
};

module.exports = {
  getAllSetores,
  getSetorById,
  createSetor,
  updateSetor,
  deleteSetor,
};
