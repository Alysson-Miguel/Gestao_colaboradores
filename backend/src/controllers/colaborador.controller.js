/**
 * Controller de Colaborador
 * Gerencia operações CRUD e lógica de negócio dos colaboradores
 */

const { prisma } = require('../config/database');
const {
  successResponse,
  createdResponse,
  deletedResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/response');

/**
 * Lista todos os colaboradores com filtros avançados
 * GET /api/colaboradores
 */
const getAllColaboradores = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    idSetor,
    idCargo,
    idEmpresa,
    idLider,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Construindo filtros
  const where = {};

  if (search) {
    where.OR = [
      { nomeCompleto: { contains: search, mode: 'insensitive' } },
      { matricula: { contains: search, mode: 'insensitive' } },
      { opsId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) where.status = status;
  if (idSetor) where.idSetor = parseInt(idSetor);
  if (idCargo) where.idCargo = parseInt(idCargo);
  if (idEmpresa) where.idEmpresa = parseInt(idEmpresa);
  if (idLider) where.idLider = idLider;

  const [colaboradores, total] = await Promise.all([
    prisma.colaborador.findMany({
      where,
      skip,
      take,
      orderBy: { nomeCompleto: 'asc' },
      include: {
        setor: { select: { idSetor: true, nomeSetor: true } },
        cargo: { select: { idCargo: true, nomeCargo: true, nivel: true } },
        empresa: { select: { idEmpresa: true, razaoSocial: true } },
        lider: { select: { opsId: true, nomeCompleto: true, matricula: true } },
        estacao: { select: { idEstacao: true, nomeEstacao: true } },
        turno: { select: { idTurno: true, nomeTurno: true } },
        escala: { select: { idEscala: true, nomeEscala: true, tipoEscala: true } },
      },
    }),
    prisma.colaborador.count({ where }),
  ]);

  return paginatedResponse(
    res,
    colaboradores,
    { page: parseInt(page), limit: parseInt(limit), total }
  );
};

/**
 * Busca um colaborador por ID (ops_id)
 * GET /api/colaboradores/:opsId
 */
const getColaboradorById = async (req, res) => {
  const { opsId } = req.params;

  const colaborador = await prisma.colaborador.findUnique({
    where: { opsId },
    include: {
      setor: true,
      cargo: true,
      empresa: true,
      contrato: true,
      estacao: true,
      turno: true,
      escala: true,
      lider: {
        select: { opsId: true, nomeCompleto: true, matricula: true, cargo: true },
      },
      subordinados: {
        select: {
          opsId: true,
          nomeCompleto: true,
          matricula: true,
          cargo: { select: { nomeCargo: true } },
          status: true,
        },
      },
      _count: {
        select: {
          subordinados: true,
          frequencias: true,
          ausencias: true,
        },
      },
    },
  });

  if (!colaborador) {
    return notFoundResponse(res, 'Colaborador não encontrado');
  }

  return successResponse(res, colaborador);
};

/**
 * Cria um novo colaborador
 * POST /api/colaboradores
 */
const createColaborador = async (req, res) => {
  const {
    opsId,
    nomeCompleto,
    genero,
    matricula,
    dataAdmissao,
    horarioInicioJornada,
    idSetor,
    idCargo,
    idLider,
    idEstacao,
    idEmpresa,
    idContrato,
    idEscala,
    idTurno,
    status,
  } = req.body;

  const colaborador = await prisma.colaborador.create({
    data: {
      opsId,
      nomeCompleto,
      genero,
      matricula,
      dataAdmissao: new Date(dataAdmissao),
      horarioInicioJornada: new Date(`1970-01-01T${horarioInicioJornada}`),
      idSetor: idSetor ? parseInt(idSetor) : null,
      idCargo: idCargo ? parseInt(idCargo) : null,
      idLider: idLider || null,
      idEstacao: idEstacao ? parseInt(idEstacao) : null,
      idEmpresa: idEmpresa ? parseInt(idEmpresa) : null,
      idContrato: idContrato ? parseInt(idContrato) : null,
      idEscala: idEscala ? parseInt(idEscala) : null,
      idTurno: idTurno ? parseInt(idTurno) : null,
      status: status || 'ATIVO',
    },
    include: {
      setor: true,
      cargo: true,
      empresa: true,
      lider: { select: { opsId: true, nomeCompleto: true } },
    },
  });

  return createdResponse(res, colaborador, 'Colaborador criado com sucesso');
};

/**
 * Atualiza um colaborador
 * PUT /api/colaboradores/:opsId
 */
const updateColaborador = async (req, res) => {
  const { opsId } = req.params;
  const updateData = { ...req.body };

  // Converte datas se existirem
  if (updateData.dataAdmissao) {
    updateData.dataAdmissao = new Date(updateData.dataAdmissao);
  }
  if (updateData.dataDesligamento) {
    updateData.dataDesligamento = new Date(updateData.dataDesligamento);
  }
  if (updateData.horarioInicioJornada) {
    updateData.horarioInicioJornada = new Date(`1970-01-01T${updateData.horarioInicioJornada}`);
  }

  // Converte IDs para inteiros
  ['idSetor', 'idCargo', 'idEstacao', 'idEmpresa', 'idContrato', 'idEscala', 'idTurno'].forEach(field => {
    if (updateData[field]) {
      updateData[field] = parseInt(updateData[field]);
    }
  });

  const colaborador = await prisma.colaborador.update({
    where: { opsId },
    data: updateData,
    include: {
      setor: true,
      cargo: true,
      empresa: true,
      lider: { select: { opsId: true, nomeCompleto: true } },
    },
  });

  return successResponse(res, colaborador, 'Colaborador atualizado com sucesso');
};

/**
 * Deleta um colaborador
 * DELETE /api/colaboradores/:opsId
 */
const deleteColaborador = async (req, res) => {
  const { opsId } = req.params;

  await prisma.colaborador.delete({
    where: { opsId },
  });

  return deletedResponse(res, 'Colaborador excluído com sucesso');
};

/**
 * Estatísticas de um colaborador
 * GET /api/colaboradores/:opsId/stats
 */
const getColaboradorStats = async (req, res) => {
  const { opsId } = req.params;
  const { startDate, endDate } = req.query;

  const colaborador = await prisma.colaborador.findUnique({
    where: { opsId },
    select: { opsId: true, nomeCompleto: true, matricula: true },
  });

  if (!colaborador) {
    return notFoundResponse(res, 'Colaborador não encontrado');
  }

  // Filtro de data
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Busca estatísticas
  const [frequencias, ausencias, subordinados] = await Promise.all([
    prisma.frequencia.findMany({
      where: {
        opsId,
        ...(Object.keys(dateFilter).length > 0 && { dataReferencia: dateFilter }),
      },
      include: {
        tipoAusencia: true,
      },
    }),
    prisma.ausencia.findMany({
      where: {
        opsId,
        ...(Object.keys(dateFilter).length > 0 && { dataInicio: dateFilter }),
      },
      include: {
        tipoAusencia: true,
      },
    }),
    prisma.colaborador.count({
      where: { idLider: opsId, status: 'ATIVO' },
    }),
  ]);

  // Calcula estatísticas
  const diasPresentes = frequencias.filter(
    (f) => f.tipoAusencia?.codigo === 'P'
  ).length;
  const diasAusentes = frequencias.filter(
    (f) => f.tipoAusencia?.impactaAbsenteismo
  ).length;
  const totalDias = frequencias.length;
  const percentualAbsenteismo = totalDias > 0 ? ((diasAusentes / totalDias) * 100).toFixed(2) : 0;

  return successResponse(res, {
    colaborador,
    periodo: { startDate, endDate },
    frequencia: {
      totalRegistros: totalDias,
      diasPresentes,
      diasAusentes,
      percentualAbsenteismo: parseFloat(percentualAbsenteismo),
    },
    ausencias: {
      total: ausencias.length,
      ativas: ausencias.filter((a) => a.status === 'ATIVO').length,
      finalizadas: ausencias.filter((a) => a.status === 'FINALIZADO').length,
    },
    lideranca: {
      subordinados,
    },
  });
};

/**
 * Histórico de movimentações do colaborador
 * GET /api/colaboradores/:opsId/historico
 */
const getColaboradorHistorico = async (req, res) => {
  const { opsId } = req.params;

  const historico = await prisma.historicoMovimentacao.findMany({
    where: { opsId },
    orderBy: { dataEfetivacao: 'desc' },
    include: {
      setorAnt: { select: { nomeSetor: true } },
      setorNov: { select: { nomeSetor: true } },
      cargoAnt: { select: { nomeCargo: true } },
      cargoNov: { select: { nomeCargo: true } },
      estacaoAnt: { select: { nomeEstacao: true } },
      estacaoNov: { select: { nomeEstacao: true } },
      turnoAnt: { select: { nomeTurno: true } },
      turnoNov: { select: { nomeTurno: true } },
      liderAnt: { select: { nomeCompleto: true } },
      liderNov: { select: { nomeCompleto: true } },
    },
  });

  return successResponse(res, historico);
};

module.exports = {
  getAllColaboradores,
  getColaboradorById,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  getColaboradorStats,
  getColaboradorHistorico,
};
