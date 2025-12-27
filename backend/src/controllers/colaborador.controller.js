/**
 * Controller de Colaborador
 */

const { prisma } = require("../config/database");
const {
  successResponse,
  createdResponse,
  deletedResponse,
  notFoundResponse,
  paginatedResponse,
  errorResponse,
} = require("../utils/response");

/* ================= CONSTANTES ================= */
const HORARIOS_PERMITIDOS = ["05:25", "13:20", "21:00"];

/* ================= GET ALL ================= */
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

  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (search) {
    where.OR = [
      { nomeCompleto: { contains: search, mode: "insensitive" } },
      { matricula: { contains: search, mode: "insensitive" } },
      { opsId: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (idSetor) where.idSetor = Number(idSetor);
  if (idCargo) where.idCargo = Number(idCargo);
  if (idEmpresa) where.idEmpresa = Number(idEmpresa);
  if (idLider) where.idLider = idLider;

  try {
    const [data, total] = await Promise.all([
      prisma.colaborador.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { nomeCompleto: "asc" },
        include: {
          empresa: true,
          cargo: true,
          setor: true,
          turno: true,
        },
      }),
      prisma.colaborador.count({ where }),
    ]);

    return paginatedResponse(res, data, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (err) {
    console.error("❌ ERRO GET ALL:", err);
    return errorResponse(res, 500, "Erro ao buscar colaboradores", err);
  }
};

/* ================= GET BY ID ================= */
const getColaboradorById = async (req, res) => {
  const { opsId } = req.params;

  try {
    const colaborador = await prisma.colaborador.findUnique({
      where: { opsId },
      include: {
        empresa: true,
        cargo: true,
        setor: true,
        turno: true,
      },
    });

    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    // ================= ATESTADOS (INDICADORES) =================
    const [totalAtestados, ativos, finalizados] = await Promise.all([
      prisma.atestadoMedico.count({
        where: { opsId },
      }),
      prisma.atestadoMedico.count({
        where: { opsId, status: "ATIVO" },
      }),
      prisma.atestadoMedico.count({
        where: { opsId, status: "FINALIZADO" },
      }),
    ]);

    return successResponse(res, {
      ...colaborador,
      indicadores: {
        atestados: {
          total: totalAtestados,
          ativos,
          finalizados,
        },
      },
    });
  } catch (err) {
    console.error("❌ ERRO GET BY ID:", err);
    return errorResponse(res, 500, "Erro ao buscar colaborador", err);
  }
};

/* ================= CREATE ================= */
const createColaborador = async (req, res) => {
  try {
    const {
      opsId,
      nomeCompleto,
      cpf,
      telefone,
      email,
      genero,
      matricula,
      dataAdmissao,
      horarioInicioJornada,
      idEmpresa,
      idSetor,
      idCargo,
      idTurno,
      status,
    } = req.body;

    /* ===== VALIDAÇÕES BÁSICAS ===== */
    if (!opsId || !nomeCompleto || !matricula || !dataAdmissao) {
      return errorResponse(
        res,
        400,
        "OPS ID, Nome, Matrícula e Data de Admissão são obrigatórios"
      );
    }

    /* ===== DATA ADMISSÃO ===== */
    let dataAdmissaoDate = null;
    if (dataAdmissao) {
      const dt = new Date(`${dataAdmissao}T00:00:00`);
      if (isNaN(dt.getTime())) {
        return errorResponse(res, 400, "Data de admissão inválida");
      }
      dataAdmissaoDate = dt;
    }

    /* ===== HORÁRIO ===== */
    let horario = null;
    if (horarioInicioJornada) {
      if (!HORARIOS_PERMITIDOS.includes(horarioInicioJornada)) {
        return errorResponse(
          res,
          400,
          `Horário inválido. Permitidos: ${HORARIOS_PERMITIDOS.join(", ")}`
        );
      }
      horario = new Date(`1970-01-01T${horarioInicioJornada}:00Z`);
    }

    const colaborador = await prisma.colaborador.create({
      data: {
        opsId,
        nomeCompleto,
        cpf: cpf || null,
        telefone: telefone || null,
        email: email || null,
        genero: genero || null,
        matricula,

        dataAdmissao: dataAdmissaoDate,
        horarioInicioJornada: horario,

        idEmpresa: idEmpresa ? Number(idEmpresa) : null,
        idSetor: idSetor ? Number(idSetor) : null,
        idCargo: idCargo ? Number(idCargo) : null,
        idTurno: idTurno ? Number(idTurno) : null,

        status: status || "ATIVO",
      },
    });

    return createdResponse(res, colaborador, "Colaborador criado com sucesso");
  } catch (err) {
    console.error("❌ ERRO CREATE:", err);
    return errorResponse(res, 500, "Erro ao criar colaborador", err);
  }
};

/* ================= UPDATE ================= */
const updateColaborador = async (req, res) => {
  const { opsId } = req.params;
  const data = { ...req.body };

  try {
    /* ===== DATA ADMISSÃO ===== */
    if (data.dataAdmissao) {
      const dt = new Date(`${data.dataAdmissao}T00:00:00`);
      if (isNaN(dt.getTime())) {
        return errorResponse(res, 400, "Data de admissão inválida");
      }
      data.dataAdmissao = dt;
    }

    /* ===== HORÁRIO ===== */
    if (data.horarioInicioJornada) {
      if (!HORARIOS_PERMITIDOS.includes(data.horarioInicioJornada)) {
        return errorResponse(
          res,
          400,
          `Horário inválido. Permitidos: ${HORARIOS_PERMITIDOS.join(", ")}`
        );
      }
      data.horarioInicioJornada = new Date(
        `1970-01-01T${data.horarioInicioJornada}:00Z`
      );
    }

    /* ===== IDS ===== */
    ["idEmpresa", "idSetor", "idCargo", "idTurno"].forEach((f) => {
      if (data[f] === "" || data[f] === undefined) {
        data[f] = null;
      } else {
        data[f] = Number(data[f]);
      }
    });

    const colaborador = await prisma.colaborador.update({
      where: { opsId },
      data,
    });

    return successResponse(res, colaborador, "Colaborador atualizado com sucesso");
  } catch (err) {
    console.error("❌ ERRO UPDATE:", err);
    return errorResponse(res, 500, "Erro ao atualizar colaborador", err);
  }
};

/* ================= DELETE ================= */
const deleteColaborador = async (req, res) => {
  const { opsId } = req.params;

  try {
    await prisma.colaborador.delete({ where: { opsId } });
    return deletedResponse(res, "Colaborador excluído com sucesso");
  } catch (err) {
    console.error("❌ ERRO DELETE:", err);
    return errorResponse(res, 500, "Erro ao excluir colaborador", err);
  }
};
const movimentarColaborador = async (req, res) => {
  const { opsId } = req.params;
  const {
    idEmpresa,
    idSetor,
    idCargo,
    idTurno,
    idLider,
    dataEfetivacao,
    motivo,
  } = req.body;

  if (!dataEfetivacao || !motivo)
    return errorResponse(res, 400, "Data e motivo são obrigatórios");

  const atual = await prisma.colaborador.findUnique({ where: { opsId } });
  if (!atual) return notFoundResponse(res, "Colaborador não encontrado");

  await prisma.$transaction([
    prisma.historicoMovimentacao.create({
      data: {
        opsId,
        tipoMovimentacao: "ORGANIZACIONAL",
        setorAnterior: atual.idSetor,
        cargoAnterior: atual.idCargo,
        turnoAnterior: atual.idTurno,
        liderAnterior: atual.idLider,

        setorNovo: idSetor ? Number(idSetor) : null,
        cargoNovo: idCargo ? Number(idCargo) : null,
        turnoNovo: idTurno ? Number(idTurno) : null,
        liderNovo: idLider || null,

        dataEfetivacao: new Date(dataEfetivacao),
        motivo,
      },
    }),

    prisma.colaborador.update({
      where: { opsId },
      data: {
        idEmpresa: idEmpresa ? Number(idEmpresa) : atual.idEmpresa,
        idSetor: idSetor ? Number(idSetor) : atual.idSetor,
        idCargo: idCargo ? Number(idCargo) : atual.idCargo,
        idTurno: idTurno ? Number(idTurno) : atual.idTurno,
        idLider: idLider || atual.idLider,
      },
    }),
  ]);

  return successResponse(res, null, "Movimentação realizada com sucesso");
};


module.exports = {
  getAllColaboradores,
  getColaboradorById,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  movimentarColaborador,
};
