const { prisma } = require('../config/database');
const { successResponse, createdResponse, deletedResponse, notFoundResponse } = require('../utils/response');

const getAllEscalas = async (req, res) => {
  const isGlobal = req.dbContext?.isGlobal ?? false;
  const estacaoId = (!isGlobal && req.dbContext?.estacaoId)
    ? req.dbContext.estacaoId
    : null;

  const colaboradoresWhere = {
    status: 'ATIVO',
    ...(estacaoId ? { idEstacao: estacaoId } : {}),
  };

  const where = estacaoId
    ? { OR: [{ idEstacao: estacaoId }, { idEstacao: null }] }
    : {};

  const escalas = await prisma.escala.findMany({
    where,
    orderBy: { nomeEscala: 'asc' },
    include: {
      estacao: { select: { idEstacao: true, nomeEstacao: true } },
      _count: {
        select: {
          colaboradores: { where: colaboradoresWhere },
        },
      },
    },
  });
  return successResponse(res, escalas);
};

const getEscalaById = async (req, res) => {
  const escala = await prisma.escala.findUnique({ where: { idEscala: parseInt(req.params.id) } });
  if (!escala) return notFoundResponse(res, 'Escala não encontrada');
  return successResponse(res, escala);
};

const createEscala = async (req, res) => {
  const { nomeEscala, tipoEscala, diasTrabalhados, diasFolga, diasDsr, descricao, ativo } = req.body;

  const idEstacao = req.body.idEstacao
    ? Number(req.body.idEstacao)
    : (req.dbContext?.estacaoId ?? null);

  const escala = await prisma.escala.create({
    data: {
      nomeEscala,
      ...(tipoEscala !== undefined && { tipoEscala }),
      ...(diasTrabalhados !== undefined && diasTrabalhados !== '' && { diasTrabalhados: parseInt(diasTrabalhados) }),
      ...(diasFolga !== undefined && diasFolga !== '' && { diasFolga: parseInt(diasFolga) }),
      ...(Array.isArray(diasDsr) && { diasDsr }),
      ...(descricao !== undefined && { descricao }),
      ativo: ativo !== undefined ? ativo : true,
      ...(idEstacao ? { idEstacao } : {}),
    },
  });
  return createdResponse(res, escala);
};

const updateEscala = async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const userEstacaoId = req.user?.idEstacao ?? null;

  const escala = await prisma.escala.findUnique({
    where: { idEscala: parseInt(req.params.id) },
    select: { idEstacao: true },
  });

  if (!escala) return notFoundResponse(res, 'Escala não encontrada');

  if (!isAdmin) {
    if (!escala.idEstacao || escala.idEstacao !== userEstacaoId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para editar esta escala.' });
    }
  }

  const { nomeEscala, tipoEscala, diasTrabalhados, diasFolga, diasDsr, descricao, ativo } = req.body;
  const updated = await prisma.escala.update({
    where: { idEscala: parseInt(req.params.id) },
    data: {
      ...(nomeEscala && { nomeEscala }),
      ...(tipoEscala !== undefined && { tipoEscala }),
      ...(diasTrabalhados !== undefined && { diasTrabalhados: diasTrabalhados !== '' && diasTrabalhados !== null ? parseInt(diasTrabalhados) : null }),
      ...(diasFolga !== undefined && { diasFolga: diasFolga !== '' && diasFolga !== null ? parseInt(diasFolga) : null }),
      ...(Array.isArray(diasDsr) && { diasDsr }),
      ...(descricao !== undefined && { descricao }),
      ...(ativo !== undefined && { ativo }),
    },
  });
  return successResponse(res, updated);
};

const deleteEscala = async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const userEstacaoId = req.user?.idEstacao ?? null;

  const escala = await prisma.escala.findUnique({
    where: { idEscala: parseInt(req.params.id) },
    select: { idEstacao: true },
  });

  if (!escala) return notFoundResponse(res, 'Escala não encontrada');

  if (!isAdmin) {
    if (!escala.idEstacao || escala.idEstacao !== userEstacaoId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para excluir esta escala.' });
    }
  }

  const total = await prisma.colaborador.count({ where: { idEscala: parseInt(req.params.id) } });
  if (total > 0) {
    return res.status(409).json({
      success: false,
      message: `Não é possível excluir esta escala pois ela possui ${total} colaborador(es) vinculado(s).`,
    });
  }
  await prisma.escala.delete({ where: { idEscala: parseInt(req.params.id) } });
  return deletedResponse(res);
};

module.exports = { getAllEscalas, getEscalaById, createEscala, updateEscala, deleteEscala };
