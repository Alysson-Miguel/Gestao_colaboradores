/**
 * Controller de Colaborador
 */

const { prisma } = require("../config/database");
const csv = require("csvtojson");
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
    return errorResponse(res, "Erro ao buscar colaboradores", 500, err);
  }
};

/* ================= GET BY ID ================= */
const getColaboradorById = async (req, res) => {
  const { opsId } = req.params;
  const RESERVED = ["import", "create", "new"];

  if (RESERVED.includes(opsId)) {
    return errorResponse(res, "Rota inválida", 404);
  }

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
    return errorResponse(res, "Erro ao buscar colaborador", 500, err);
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
        "OPS ID, Nome, Matrícula e Data de Admissão são obrigatórios",
        400
      );
    }

    /* ===== DATA ADMISSÃO ===== */
    let dataAdmissaoDate = null;
    if (dataAdmissao) {
      const dt = new Date(`${dataAdmissao}T00:00:00`);
      if (isNaN(dt.getTime())) {
        return errorResponse(res, "Data de admissão inválida", 400);
      }
      dataAdmissaoDate = dt;
    }

    /* ===== HORÁRIO ===== */
    let horario = null;
    if (horarioInicioJornada) {
      if (!HORARIOS_PERMITIDOS.includes(horarioInicioJornada)) {
        return errorResponse(
          res,
          `Horário inválido. Permitidos: ${HORARIOS_PERMITIDOS.join(", ")}`,
          400
        );
      }
      horario = new Date(`1970-01-01T${horarioInicioJornada}:00Z`);
    } else {
      // Default se não fornecido (baseado em schema required)
      horario = new Date(`1970-01-01T05:25:00Z`); // Primeiro horário permitido
    }

    const data = {
      opsId,
      nomeCompleto,
      cpf: cpf || null,
      telefone: telefone || null,
      email: email || null,
      genero: genero || null,
      matricula,
      dataAdmissao: dataAdmissaoDate,
      horarioInicioJornada: horario,
      status: status || "ATIVO",
      // Relações nested: connect se ID existe
      ...(idEmpresa ? { empresa: { connect: { idEmpresa: Number(idEmpresa) } } } : {}),
      ...(idSetor ? { setor: { connect: { idSetor: Number(idSetor) } } } : {}),
      ...(idCargo ? { cargo: { connect: { idCargo: Number(idCargo) } } } : {}),
      ...(idTurno ? { turno: { connect: { idTurno: Number(idTurno) } } } : {}),
    };

    const colaborador = await prisma.colaborador.create({
      data,
    });

    return createdResponse(res, colaborador, "Colaborador criado com sucesso");
  } catch (err) {
    console.error("❌ ERRO CREATE:", err);
    return errorResponse(res, "Erro ao criar colaborador", 500, err);
  }
};

/* ================= UPDATE ================= */
const updateColaborador = async (req, res) => {
  const { opsId } = req.params;
  const inputData = { ...req.body };

  try {
    /* ===== DATA ADMISSÃO ===== */
    if (inputData.dataAdmissao) {
      const dt = new Date(`${inputData.dataAdmissao}T00:00:00`);
      if (isNaN(dt.getTime())) {
        return errorResponse(res, "Data de admissão inválida", 400);
      }
      inputData.dataAdmissao = dt;
    }

    /* ===== HORÁRIO ===== */
    if (inputData.horarioInicioJornada !== undefined) {
      if (inputData.horarioInicioJornada && !HORARIOS_PERMITIDOS.includes(inputData.horarioInicioJornada)) {
        return errorResponse(
          res,
          `Horário inválido. Permitidos: ${HORARIOS_PERMITIDOS.join(", ")}`,
          400
        );
      }
      inputData.horarioInicioJornada = inputData.horarioInicioJornada
        ? new Date(`1970-01-01T${inputData.horarioInicioJornada}:00Z`)
        : new Date(`1970-01-01T05:25:00Z`); // Default se vazio
    }

    // Prepare data com nested relations
    const data = {
      ...inputData,
      // Converte vazios pra null/omit
      ...(inputData.genero === "" ? { genero: null } : {}),
      ...(inputData.cpf === "" ? { cpf: null } : {}),
      ...(inputData.email === "" ? { email: null } : {}),
      ...(inputData.telefone === "" ? { telefone: null } : {}),
    };

    // Remove IDs diretos e usa connect/disconnect
    const { idEmpresa, idSetor, idCargo, idTurno } = inputData;
    if (idEmpresa !== undefined) {
      if (idEmpresa === "" || idEmpresa === null) {
        data.empresa = { disconnect: true };
      } else {
        data.empresa = { connect: { idEmpresa: Number(idEmpresa) } };
      }
      delete data.idEmpresa;
    }
    if (idSetor !== undefined) {
      if (idSetor === "" || idSetor === null) {
        data.setor = { disconnect: true };
      } else {
        data.setor = { connect: { idSetor: Number(idSetor) } };
      }
      delete data.idSetor;
    }
    if (idCargo !== undefined) {
      if (idCargo === "" || idCargo === null) {
        data.cargo = { disconnect: true };
      } else {
        data.cargo = { connect: { idCargo: Number(idCargo) } };
      }
      delete data.idCargo;
    }
    if (idTurno !== undefined) {
      if (idTurno === "" || idTurno === null) {
        data.turno = { disconnect: true };
      } else {
        data.turno = { connect: { idTurno: Number(idTurno) } };
      }
      delete data.idTurno;
    }

    const colaborador = await prisma.colaborador.update({
      where: { opsId },
      data,
    });

    return successResponse(res, colaborador, "Colaborador atualizado com sucesso");
  } catch (err) {
    console.error("❌ ERRO UPDATE:", err);
    return errorResponse(res, "Erro ao atualizar colaborador", 500, err);
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
    return errorResponse(res, "Erro ao excluir colaborador", 500, err);
  }
};

/* ================= MOVIMENTAR ================= */
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

  if (!dataEfetivacao || !motivo) {
    return errorResponse(res, "Data e motivo são obrigatórios", 400);
  }

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
        // Usa nested connect/disconnect pra consistência
        ...(idEmpresa !== undefined ? { empresa: { connect: { idEmpresa: Number(idEmpresa) } } } : {}),
        ...(idSetor !== undefined ? { setor: { connect: { idSetor: Number(idSetor) } } } : {}),
        ...(idCargo !== undefined ? { cargo: { connect: { idCargo: Number(idCargo) } } } : {}),
        ...(idTurno !== undefined ? { turno: { connect: { idTurno: Number(idTurno) } } } : {}),
        ...(idLider !== undefined ? { lider: { connect: { opsId: idLider } } } : {}), // Assumindo opsId como unique
      },
    }),
  ]);

  return successResponse(res, null, "Movimentação realizada com sucesso");
};

/* ================= IMPORT CSV ================= */
const importColaboradores = async (req, res) => {
  if (!req.file) {
    return errorResponse(res, "Arquivo CSV não enviado", 400);
  }

  try {
    const csvString = req.file.buffer.toString("utf-8");
    const rows = await csv({ delimiter: "," }).fromString(csvString);

    if (!rows || rows.length === 0) {
      return errorResponse(res, "CSV vazio ou inválido", 400);
    }

    let criados = 0;
    let atualizados = 0;
    let skipped = 0;
    const errors = [];

    // Cache para lookups (otimiza se nomes repetem)
    const cache = {
      empresas: new Map(),
      setores: new Map(),
      cargos: new Map(),
      turnos: new Map(),
    };

    const getOrFetch = async (model, keyField, value, cacheMap) => {
      if (cacheMap.has(value)) return cacheMap.get(value);
      const result = await prisma[model].findUnique({
        where: { [keyField]: value },
        select: { [`id${model.charAt(0).toUpperCase() + model.slice(1)}`]: true },
      });
      cacheMap.set(value, result);
      return result;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let opsId = null; // Declarar fora do try para scope no catch

      try {
        /* ================= OPS ID ================= */
        opsId = String(
          row["Ops ID"] ||
          row["Ops ID "] ||
          row["OpsId"] ||
          ""
        ).trim();

        if (!opsId) {
          skipped++;
          errors.push(`Linha ${i + 1}: Ops ID obrigatório`);
          continue;
        }

        /* ================= CAMPOS OBRIGATÓRIOS ================= */
        let nomeCompleto = String(
          row["Nome do Funcionário"] || row["Nome"] || ""
        ).trim();

        let matricula = String(
          row["Matrícula"] || row["Matricula"] || ""
        ).trim();

        if (!nomeCompleto || !matricula) {
          skipped++;
          errors.push(`Linha ${i + 1} (Ops ID ${opsId}): Nome ou matrícula ausente`);
          continue;
        }

        // Limitar comprimento para evitar erros de DB (ajuste baseado no schema Prisma)
        nomeCompleto = nomeCompleto.slice(0, 255); // Assumindo varchar(255) para nomeCompleto
        matricula = matricula.slice(0, 50); // Assumindo limite razoável

        /* ================= CAMPOS BÁSICOS ================= */
        let cpf = row["CPF"]
          ? String(row["CPF"]).replace(/\D/g, "").slice(0, 11) // Limita a 11 dígitos
          : null;

        let genero =
          row["Sexo"]?.toString().toUpperCase().includes("MASCULIN")
            ? "MASCULINO"
            : row["Sexo"]?.toString().toUpperCase().includes("FEMININ")
            ? "FEMININO"
            : null;

        let email = (row["E-mail"] || "").toString().trim().slice(0, 255) || null; // Limita email
        let telefone = (row["Celular"] || "").toString().trim().slice(0, 20) || null; // Limita telefone

        /* ================= DATAS (dd/mm/yyyy) ================= */
        const parseDateBR = (value) => {
          if (!value) return null;
          const valStr = String(value).trim();
          const [d, m, y] = valStr.split("/");
          if (!d || !m || !y) return null;
          const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
          return isNaN(date.getTime()) ? null : date;
        };

        const dataNascimento = parseDateBR(row["Data de Nascimento"]);
        const dataAdmissao = parseDateBR(row["Data de admissão"]);

        if (!dataAdmissao) {
          skipped++;
          errors.push(`Linha ${i + 1} (Ops ID ${opsId}): Data de admissão ausente ou inválida`);
          continue;
        }

        /* ================= RELAÇÕES (com cache) ================= */
        const empresaValue = (row["Empresa"] || "").toString().trim();
        const setorValue = (row["Setor"] || "").toString().trim().slice(0, 100); // Limita nomeSetor
        const cargoValue = (row["Cargo"] || "").toString().trim().slice(0, 100); // Limita nomeCargo
        const jornadaValue = (row["Jornada"] || "").toString().trim().slice(0, 50); // Limita nomeTurno

        const [empresa, setor, cargo, turno] = await Promise.all([
          empresaValue ? getOrFetch('empresa', 'razaoSocial', empresaValue.slice(0, 255), cache.empresas) : null, // Limita razaoSocial
          setorValue ? getOrFetch('setor', 'nomeSetor', setorValue, cache.setores) : null,
          cargoValue ? getOrFetch('cargo', 'nomeCargo', cargoValue, cache.cargos) : null,
          jornadaValue ? getOrFetch('turno', 'nomeTurno', jornadaValue, cache.turnos) : null,
        ]);

        /* ================= HORÁRIO JORNADA ================= */
        let horarioInicioJornada = null;
        const escalaStr = (row["Escala de trabalho"] || "").toString().trim();

        if (escalaStr) {
          // Extrai horário inicial de strings como "13:20 Às 22:59 - 5X2"
          const match = escalaStr.match(/(\d{2}:\d{2})\s*(?:Às|A\s*às)\s*/i);
          const clean = match ? match[1] : null;
          if (clean && HORARIOS_PERMITIDOS.includes(clean)) {
            horarioInicioJornada = new Date(`1970-01-01T${clean}:00`);
          } else if (clean) {
            skipped++;
            errors.push(
              `Linha ${i + 1} (Ops ID ${opsId}): Horário inválido (${clean})`
            );
            continue;
          }
        }

        // Default se não extraído
        if (!horarioInicioJornada) {
          horarioInicioJornada = new Date(`1970-01-01T05:25:00`); // T1 default
        }

        let status = "ATIVO";
        const statusStr = (row["Status HC"] || "").toString().trim();
        if (statusStr && statusStr.toLowerCase().includes("ativo")) {
          status = "ATIVO";
        } else if (statusStr && statusStr.toLowerCase().includes("inativo")) {
          status = "INATIVO";
        }

        /* ================= DATA (USANDO NESTED RELATIONS) ================= */
        const data = {
          opsId,
          nomeCompleto,
          cpf,
          matricula,
          genero,
          dataNascimento,
          dataAdmissao,
          email,
          telefone,
          status,
          horarioInicioJornada,
          // Relações nested
          ...(empresa ? { empresa: { connect: { idEmpresa: empresa.idEmpresa } } } : {}),
          ...(setor ? { setor: { connect: { idSetor: setor.idSetor } } } : {}),
          ...(cargo ? { cargo: { connect: { idCargo: cargo.idCargo } } } : {}),
          ...(turno ? { turno: { connect: { idTurno: turno.idTurno } } } : {}),
        };

        /* ================= UPSERT (ATÔMICO) ================= */
        const result = await prisma.colaborador.upsert({
          where: { opsId },
          update: data,
          create: data,
        });

        // Determina se foi create ou update baseado no ID (ou adicione select para dataCriacao)
        if (result.dataCriacao.getTime() === new Date().getTime() || !existing) { // Aproximação, ou use count prévio
          criados++;
        } else {
          atualizados++;
        }
      } catch (rowErr) {
        console.error(`Erro linha ${i + 1}:`, rowErr);
        skipped++;
        // Se for duplicate matricula (P2002), log como skipped por duplicata
        if (rowErr.code === 'P2002' && rowErr.meta.target.includes('matricula')) {
          errors.push(`Linha ${i + 1} (Ops ID ${opsId || 'N/A'}): Matrícula duplicada, pulada`);
        } else {
          errors.push(`Linha ${i + 1} (Ops ID ${opsId || 'N/A'}): ${rowErr.message}`);
        }
      }
    }

    return successResponse(
      res,
      {
        resumo: {
          totalLinhas: rows.length,
          criados,
          atualizados,
          skipped,
        },
        erros: errors.length ? errors : null,
      },
      "Importação concluída com sucesso"
    );
  } catch (err) {
    console.error("❌ ERRO IMPORT CSV:", err);
    return errorResponse(
      res,
      "Erro ao processar CSV",
      500,
      err
    );
  }
};


/* ================= GET BY OPS ID (DUPLICADO - MANTER SE NECESSÁRIO) ================= */
const getByOpsId = async (req, res) => {
  // ✅ Delega para getColaboradorById se for o mesmo
  return getColaboradorById(req, res);
};

/* ================= STATS E HISTORICO (ASSUMINDO QUE EXISTEM) ================= */
const getColaboradorStats = async (req, res) => {
  // Implemente se necessário (ex.: stats de frequência, ausências)
  return successResponse(res, { message: "Stats pendentes" });
};

const getColaboradorHistorico = async (req, res) => {
  // Implemente se necessário (ex.: historico de movimentações)
  return successResponse(res, { message: "Historico pendente" });
};

module.exports = {
  getAllColaboradores,
  getColaboradorById,
  getByOpsId,
  getColaboradorStats,
  getColaboradorHistorico,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  movimentarColaborador,
  importColaboradores,
};