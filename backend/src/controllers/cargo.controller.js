/**
 * Controller de Cargo
 * Gerencia operações CRUD de cargos
 */

const { prisma } = require('../config/database');
const {
  successResponse,
  createdResponse,
  deletedResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/response');

/* ================= GET ALL ================= */
const getAllCargos = async (req, res) => {
  const { page = 1, limit = 10, search, ativo } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const isGlobal = req.dbContext?.isGlobal ?? false;
  const estacaoId = (!isGlobal && req.dbContext?.estacaoId) ? req.dbContext.estacaoId : null;

  const colaboradoresWhere = {
    status: 'ATIVO',
    ...(estacaoId ? { idEstacao: estacaoId } : {}),
  };

  const where = {};

  if (search) {
    where.OR = [
      { nomeCargo: { contains: search, mode: 'insensitive' } },
      { nivel: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (ativo !== undefined) {
    where.ativo = ativo === 'true';
  }

  if (estacaoId) {
    const scopeFilter = [{ idEstacao: estacaoId }, { idEstacao: null }];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: scopeFilter }];
      delete where.OR;
    } else {
      where.OR = scopeFilter;
    }
  }

  const [cargos, total] = await Promise.all([
    prisma.cargo.findMany({
      where,
      skip,
      take,
      orderBy: { nomeCargo: 'asc' },
      include: {
        estacao: { select: { idEstacao: true, nomeEstacao: true } },
        _count: {
          select: { colaboradores: { where: colaboradoresWhere } },
        },
      },
    }),
    prisma.cargo.count({ where }),
  ]);

  return paginatedResponse(res, cargos, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
  });
};

/* ================= GET BY ID ================= */
const getCargoById = async (req, res) => {
  const { id } = req.params;

  const cargo = await prisma.cargo.findUnique({
    where: { idCargo: parseInt(id) },
    include: {
      colaboradores: {
        where: { status: 'ATIVO' },
        select: {
          opsId: true,
          nomeCompleto: true,
          matricula: true,
        },
      },
      _count: {
        select: { colaboradores: true },
      },
    },
  });

  if (!cargo) {
    return notFoundResponse(res, 'Cargo não encontrado');
  }

  return successResponse(res, cargo);
};

/* ================= CREATE ================= */
const createCargo = async (req, res) => {
  const { nomeCargo, nivel, descricao, ativo } = req.body;

  const idEstacao = req.body.idEstacao
    ? Number(req.body.idEstacao)
    : (req.dbContext?.estacaoId ?? null);

  const cargo = await prisma.cargo.create({
    data: {
      nomeCargo,
      nivel,
      descricao,
      ativo: ativo !== undefined ? ativo : true,
      ...(idEstacao ? { idEstacao } : {}),
    },
  });

  return createdResponse(res, cargo, 'Cargo criado com sucesso');
};

/* ================= UPDATE ================= */
const updateCargo = async (req, res) => {
  const { id } = req.params;
  const { nomeCargo, nivel, descricao, ativo } = req.body;

  const isAdmin = req.user?.role === 'ADMIN';
  const userEstacaoId = req.user?.idEstacao ?? null;

  // Busca o cargo para verificar a assinatura de estação
  const cargo = await prisma.cargo.findUnique({
    where: { idCargo: parseInt(id) },
    select: { idEstacao: true },
  });

  if (!cargo) return notFoundResponse(res, 'Cargo não encontrado');

  // Não-admin só pode editar cargos da própria estação
  if (!isAdmin) {
    if (!cargo.idEstacao || cargo.idEstacao !== userEstacaoId) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para editar este cargo.',
      });
    }
  }

  const updated = await prisma.cargo.update({
    where: { idCargo: parseInt(id) },
    data: {
      ...(nomeCargo && { nomeCargo }),
      ...(nivel !== undefined && { nivel }),
      ...(descricao !== undefined && { descricao }),
      ...(ativo !== undefined && { ativo }),
    },
  });

  return successResponse(res, updated, 'Cargo atualizado com sucesso');
};

/* ================= DELETE ================= */
const deleteCargo = async (req, res) => {
  const { id } = req.params;

  const isAdmin = req.user?.role === 'ADMIN';
  const userEstacaoId = req.user?.idEstacao ?? null;

  const cargo = await prisma.cargo.findUnique({
    where: { idCargo: parseInt(id) },
    select: { idEstacao: true },
  });

  if (!cargo) return notFoundResponse(res, 'Cargo não encontrado');

  // Não-admin só pode excluir cargos da própria estação
  if (!isAdmin) {
    if (!cargo.idEstacao || cargo.idEstacao !== userEstacaoId) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para excluir este cargo.',
      });
    }
  }

  const total = await prisma.colaborador.count({ where: { idCargo: parseInt(id) } });
  if (total > 0) {
    return res.status(409).json({
      success: false,
      message: `Não é possível excluir este cargo pois ele possui ${total} colaborador(es) vinculado(s).`,
    });
  }

  await prisma.cargo.delete({ where: { idCargo: parseInt(id) } });
  return deletedResponse(res, 'Cargo excluído com sucesso');
};

module.exports = {
  getAllCargos,
  getCargoById,
  createCargo,
  updateCargo,
  deleteCargo,
};
