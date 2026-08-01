const { prisma } = require("../config/database");
const {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
} = require("../utils/response");
const { isDiaDSR } = require("../utils/dsr");
const {
  sendSolicitacaoOperacionalEmail,
  sendDecisaoOperacionalEmail,
} = require("../reports/email");

class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/* =====================================================
   HELPERS
===================================================== */
function normalizeDateOnly(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function ymd(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function estacaoWhereSolicitacao(req) {
  return !req.dbContext?.isGlobal && req.dbContext?.estacaoId
    ? { colaborador: { idEstacao: req.dbContext.estacaoId } }
    : {};
}

/**
 * Usado em buscas por ID (que não passam pelo where da listagem):
 * bloqueia acesso a registros de outra estação.
 */
function pertenceAEstacaoDoUsuario(req, idEstacaoRegistro) {
  if (req.dbContext?.isGlobal || !req.dbContext?.estacaoId) return true;
  if (!idEstacaoRegistro) return true;
  return idEstacaoRegistro === req.dbContext.estacaoId;
}

/**
 * Um aprovador só pode decidir solicitações da própria estação —
 * exceto quem tem idEstacao null (aprovador global, só Admin cadastra).
 */
async function isAprovadorAtivo(email, idEstacaoSolicitacao) {
  if (!email) return false;
  const aprovador = await prisma.aprovadorOperacional.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      ativo: true,
      OR: [{ idEstacao: idEstacaoSolicitacao ?? null }, { idEstacao: null }],
    },
  });
  return !!aprovador;
}

/**
 * Validações inteligentes comuns a todos os tipos: colaborador existe e
 * está ativo, não tem outra solicitação pendente, e não há duplicata
 * pra mesma data.
 */
async function validarColaboradorDisponivel(opsId, dataStr, { excluirIdSolicitacao } = {}) {
  const colaborador = await prisma.colaborador.findUnique({
    where: { opsId },
    select: { opsId: true, nomeCompleto: true, status: true, idEstacao: true, idEscala: true, escala: { select: { nomeEscala: true } } },
  });

  if (!colaborador) {
    throw new HttpError(`Colaborador não encontrado (${opsId})`, 400);
  }
  if (colaborador.status !== "ATIVO") {
    throw new HttpError(`${colaborador.nomeCompleto} não está ativo`, 400);
  }

  const pendente = await prisma.solicitacaoOperacional.findFirst({
    where: {
      status: "PENDENTE",
      OR: [{ opsId }, { opsId2: opsId }],
      ...(excluirIdSolicitacao ? { idSolicitacao: { not: excluirIdSolicitacao } } : {}),
    },
  });
  if (pendente) {
    throw new HttpError(`${colaborador.nomeCompleto} já possui uma solicitação pendente`, 400);
  }

  const dataNormalizada = normalizeDateOnly(dataStr);
  const duplicada = await prisma.solicitacaoOperacional.findFirst({
    where: {
      status: { in: ["PENDENTE", "APROVADA"] },
      data: dataNormalizada,
      OR: [{ opsId }, { opsId2: opsId }],
      ...(excluirIdSolicitacao ? { idSolicitacao: { not: excluirIdSolicitacao } } : {}),
    },
  });
  if (duplicada) {
    throw new HttpError(
      `${colaborador.nomeCompleto} já tem uma solicitação para ${ymd(dataNormalizada)}`,
      400
    );
  }

  return colaborador;
}

/**
 * Verifica se uma data é DSR "de verdade" para o colaborador — ou seja,
 * exatamente o que o Controle de Presença exibe hoje para aquele dia.
 * O DSR de um colaborador nem sempre segue o padrão semanal da escala:
 * o módulo de Planejamento de Folgas Dominicais grava DSRs extras/rotativos
 * direto em `frequencia` (justificativa "DSR_FOLGA_DOMINICAL_AUTOMATICA"),
 * então uma data pode ser DSR sem bater com `escala.diasDsr`. Por isso,
 * a fonte de verdade é sempre o registro em `frequencia` quando ele existe;
 * o padrão semanal só serve de fallback para datas ainda não geradas.
 */
async function isDiaDSRReal(opsId, data, nomeEscala) {
  const freq = await prisma.frequencia.findUnique({
    where: { opsId_dataReferencia: { opsId, dataReferencia: data } },
    include: { tipoAusencia: true },
  });
  if (freq) {
    return freq.tipoAusencia?.codigo === "DSR";
  }
  return isDiaDSR(data, nomeEscala);
}

/* =====================================================
   BUSCAR COLABORADOR POR CPF (autofill dos formulários)
===================================================== */
exports.buscarColaboradorPorCpf = async (req, res) => {
  try {
    const cpf = String(req.query.cpf || "").replace(/\D/g, "");
    if (cpf.length !== 11) {
      return errorResponse(res, "CPF inválido", 400);
    }

    const colaborador = await prisma.colaborador.findFirst({
      where: { cpf },
      select: {
        opsId: true,
        nomeCompleto: true,
        matricula: true,
        cpf: true,
        status: true,
        idEstacao: true,
        idEscala: true,
        cargo: { select: { nomeCargo: true } },
        setor: { select: { nomeSetor: true } },
        turno: { select: { nomeTurno: true } },
        empresa: { select: { razaoSocial: true } },
        escala: { select: { nomeEscala: true } },
        lider: { select: { nomeCompleto: true } },
      },
    });

    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    if (!pertenceAEstacaoDoUsuario(req, colaborador.idEstacao)) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    return successResponse(res, {
      opsId: colaborador.opsId,
      nomeCompleto: colaborador.nomeCompleto,
      matricula: colaborador.matricula,
      cpf: colaborador.cpf,
      status: colaborador.status,
      cargo: colaborador.cargo?.nomeCargo || null,
      setor: colaborador.setor?.nomeSetor || null,
      turno: colaborador.turno?.nomeTurno || null,
      empresa: colaborador.empresa?.razaoSocial || null,
      lider: colaborador.lider?.nomeCompleto || null,
      idEscala: colaborador.idEscala,
      nomeEscala: colaborador.escala?.nomeEscala || null,
    });
  } catch (err) {
    console.error("❌ buscarColaboradorPorCpf:", err);
    return errorResponse(res, "Erro ao buscar colaborador", 500);
  }
};

/* =====================================================
   LISTAR SOLICITAÇÕES
===================================================== */
exports.listSolicitacoes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      tipo,
      dataInicio,
      dataFim,
      solicitante,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = { ...estacaoWhereSolicitacao(req) };
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;
    if (solicitante) where.solicitante = { name: { contains: solicitante, mode: "insensitive" } };
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(`${dataInicio}T00:00:00.000Z`);
      if (dataFim) where.data.lte = new Date(`${dataFim}T23:59:59.999Z`);
    }

    const [solicitacoes, total] = await Promise.all([
      prisma.solicitacaoOperacional.findMany({
        where,
        orderBy: { data: "desc" },
        skip,
        take: limitNum,
        include: {
          colaborador: {
            select: {
              nomeCompleto: true,
              cpf: true,
              setor: { select: { nomeSetor: true } },
              turno: { select: { nomeTurno: true } },
            },
          },
          colaborador2: { select: { nomeCompleto: true } },
          solicitante: { select: { name: true } },
          decididoPor: { select: { name: true } },
        },
      }),
      prisma.solicitacaoOperacional.count({ where }),
    ]);

    return paginatedResponse(res, solicitacoes, { page: pageNum, limit: limitNum, total });
  } catch (err) {
    console.error("❌ listSolicitacoes (operacional):", err);
    return errorResponse(res, "Erro ao listar solicitações", 500);
  }
};

/* =====================================================
   ESTATÍSTICAS (CARDS DO DASHBOARD)
===================================================== */
exports.statsSolicitacoes = async (req, res) => {
  try {
    const estacaoWhere = estacaoWhereSolicitacao(req);

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0, 23, 59, 59);

    const [pendentes, aprovadas, reprovadas, doMes] = await Promise.all([
      prisma.solicitacaoOperacional.count({ where: { ...estacaoWhere, status: "PENDENTE" } }),
      prisma.solicitacaoOperacional.count({ where: { ...estacaoWhere, status: "APROVADA" } }),
      prisma.solicitacaoOperacional.count({ where: { ...estacaoWhere, status: "REPROVADA" } }),
      prisma.solicitacaoOperacional.count({
        where: { ...estacaoWhere, dataCriacao: { gte: inicioMes, lte: fimMes } },
      }),
    ]);

    return successResponse(res, { pendentes, aprovadas, reprovadas, doMes });
  } catch (err) {
    console.error("❌ statsSolicitacoes (operacional):", err);
    return errorResponse(res, "Erro ao buscar estatísticas", 500);
  }
};

/* =====================================================
   BUSCAR SOLICITAÇÃO POR ID
===================================================== */
exports.getSolicitacao = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitacao = await prisma.solicitacaoOperacional.findUnique({
      where: { idSolicitacao: Number(id) },
      include: {
        colaborador: {
          select: {
            nomeCompleto: true,
            cpf: true,
            matricula: true,
            idEstacao: true,
            cargo: { select: { nomeCargo: true } },
            setor: { select: { nomeSetor: true } },
            turno: { select: { nomeTurno: true } },
            lider: { select: { nomeCompleto: true } },
          },
        },
        colaborador2: {
          select: {
            nomeCompleto: true,
            cpf: true,
            matricula: true,
            cargo: { select: { nomeCargo: true } },
            setor: { select: { nomeSetor: true } },
            turno: { select: { nomeTurno: true } },
            lider: { select: { nomeCompleto: true } },
          },
        },
        solicitante: { select: { name: true, email: true, opsId: true } },
        decididoPor: { select: { name: true, email: true } },
        historico: { orderBy: { criadoEm: "asc" } },
      },
    });

    if (!solicitacao || !pertenceAEstacaoDoUsuario(req, solicitacao.colaborador?.idEstacao)) {
      return notFoundResponse(res, "Solicitação não encontrada");
    }

    const podeDecidir =
      solicitacao.status === "PENDENTE" &&
      (await isAprovadorAtivo(req.user.email, solicitacao.colaborador?.idEstacao));

    return successResponse(res, { ...solicitacao, podeDecidir });
  } catch (err) {
    console.error("❌ getSolicitacao (operacional):", err);
    return errorResponse(res, "Erro ao buscar solicitação", 500);
  }
};

/* =====================================================
   CALENDÁRIO — fonte única de dados (colorido por status)
===================================================== */
exports.listarCalendario = async (req, res) => {
  try {
    const { inicio, fim } = req.query;

    if (!inicio || !fim) {
      return errorResponse(res, "Parâmetros inicio e fim são obrigatórios", 400);
    }

    const where = {
      data: {
        gte: new Date(`${inicio}T00:00:00.000Z`),
        lte: new Date(`${fim}T23:59:59.999Z`),
      },
      ...estacaoWhereSolicitacao(req),
    };

    const solicitacoes = await prisma.solicitacaoOperacional.findMany({
      where,
      select: {
        idSolicitacao: true,
        tipo: true,
        status: true,
        data: true,
        motivo: true,
        sinergiaDestino: true,
        bhDiaCompleto: true,
        colaborador: { select: { nomeCompleto: true, cpf: true, setor: { select: { nomeSetor: true } }, turno: { select: { nomeTurno: true } } } },
        colaborador2: { select: { nomeCompleto: true } },
        decididoPor: { select: { name: true } },
      },
      orderBy: { data: "asc" },
    });

    return successResponse(res, solicitacoes);
  } catch (err) {
    console.error("❌ listarCalendario (operacional):", err);
    return errorResponse(res, "Erro ao buscar calendário", 500);
  }
};

/* =====================================================
   CRIAR SOLICITAÇÃO
===================================================== */
exports.createSolicitacao = async (req, res) => {
  try {
    const { tipo, opsId, motivo } = req.body;

    if (!tipo || !opsId || !motivo?.trim()) {
      return errorResponse(res, "Campos obrigatórios não informados", 400);
    }
    if (!req.user?.id) {
      return errorResponse(res, "Usuário não autenticado", 401);
    }

    const dadosBase = {
      tipo,
      motivo: motivo.trim(),
      solicitanteUserId: req.user.id,
    };

    if (tipo === "FOLGA") {
      const { data } = req.body;
      if (!data) return errorResponse(res, "Data da folga é obrigatória", 400);

      await validarColaboradorDisponivel(opsId, data);

      dadosBase.opsId = opsId;
      dadosBase.data = normalizeDateOnly(data);
    } else if (tipo === "BANCO_HORAS") {
      const { data, bhDiaCompleto, bhQuantidadeHoras, bhHoraEntrada } = req.body;
      if (!data) return errorResponse(res, "Data é obrigatória", 400);
      if (!bhDiaCompleto && (!bhQuantidadeHoras || !bhHoraEntrada)) {
        return errorResponse(
          res,
          "Informe a quantidade de horas e a hora de entrada, ou marque dia completo",
          400
        );
      }

      await validarColaboradorDisponivel(opsId, data);

      dadosBase.opsId = opsId;
      dadosBase.data = normalizeDateOnly(data);
      dadosBase.bhDiaCompleto = !!bhDiaCompleto;
      dadosBase.bhQuantidadeHoras = bhDiaCompleto ? null : Number(bhQuantidadeHoras);
      dadosBase.bhHoraEntrada = bhDiaCompleto ? null : bhHoraEntrada;
    } else if (tipo === "SINERGIA") {
      const { data, sinergiaDestino } = req.body;
      if (!data || !sinergiaDestino) {
        return errorResponse(res, "Data e destino da sinergia são obrigatórios", 400);
      }
      if (!["FULL", "TRATATIVAS", "OUTRA_OPERACAO"].includes(sinergiaDestino)) {
        return errorResponse(res, "Destino de sinergia inválido", 400);
      }

      await validarColaboradorDisponivel(opsId, data);

      dadosBase.opsId = opsId;
      dadosBase.data = normalizeDateOnly(data);
      dadosBase.sinergiaDestino = sinergiaDestino;
    } else if (tipo === "TROCA_DSR") {
      const { opsId2, dsrDataAtual1, dsrDataNova1, dsrDataAtual2, dsrDataNova2 } = req.body;

      if (!opsId2 || !dsrDataAtual1 || !dsrDataNova1 || !dsrDataAtual2 || !dsrDataNova2) {
        return errorResponse(res, "Preencha os dados dos dois colaboradores e as 4 datas", 400);
      }
      if (opsId === opsId2) {
        return errorResponse(res, "Os dois colaboradores devem ser diferentes", 400);
      }
      if (dsrDataAtual1 !== dsrDataNova2 || dsrDataAtual2 !== dsrDataNova1) {
        return errorResponse(
          res,
          "A troca precisa ser uma inversão exata: o DSR atual de um deve virar o novo DSR do outro",
          400
        );
      }

      const colaborador1 = await validarColaboradorDisponivel(opsId, dsrDataNova1);
      const colaborador2 = await validarColaboradorDisponivel(opsId2, dsrDataNova2);

      const dsr1 = await isDiaDSRReal(opsId, normalizeDateOnly(dsrDataAtual1), colaborador1.escala?.nomeEscala);
      if (!dsr1) {
        return errorResponse(res, `${dsrDataAtual1} não é dia de DSR para ${colaborador1.nomeCompleto}`, 400);
      }
      const dsr2 = await isDiaDSRReal(opsId2, normalizeDateOnly(dsrDataAtual2), colaborador2.escala?.nomeEscala);
      if (!dsr2) {
        return errorResponse(res, `${dsrDataAtual2} não é dia de DSR para ${colaborador2.nomeCompleto}`, 400);
      }

      dadosBase.opsId = opsId;
      dadosBase.opsId2 = opsId2;
      dadosBase.data = normalizeDateOnly(dsrDataNova1);
      dadosBase.dsrDataAtual1 = normalizeDateOnly(dsrDataAtual1);
      dadosBase.dsrDataNova1 = normalizeDateOnly(dsrDataNova1);
      dadosBase.dsrDataAtual2 = normalizeDateOnly(dsrDataAtual2);
      dadosBase.dsrDataNova2 = normalizeDateOnly(dsrDataNova2);
    } else {
      return errorResponse(res, "Tipo de solicitação inválido", 400);
    }

    const solicitacao = await prisma.$transaction(async (tx) => {
      const nova = await tx.solicitacaoOperacional.create({ data: dadosBase });

      await tx.solicitacaoOperacionalHistorico.create({
        data: { idSolicitacao: nova.idSolicitacao, evento: `Solicitação criada por ${req.user.name}` },
      });

      return nova;
    });

    // Notificação por e-mail — não bloqueia a criação em caso de falha
    try {
      const colaborador = await prisma.colaborador.findUnique({
        where: { opsId },
        select: {
          nomeCompleto: true,
          cpf: true,
          idEstacao: true,
          cargo: { select: { nomeCargo: true } },
          setor: { select: { nomeSetor: true } },
          turno: { select: { nomeTurno: true } },
          lider: { select: { nomeCompleto: true } },
        },
      });

      const aprovadoresAtivos = await prisma.aprovadorOperacional.findMany({
        where: {
          ativo: true,
          OR: [{ idEstacao: colaborador?.idEstacao ?? null }, { idEstacao: null }],
        },
      });

      if (aprovadoresAtivos.length > 0) {
        await sendSolicitacaoOperacionalEmail({
          to: aprovadoresAtivos.map((a) => a.email),
          solicitacao: {
            idSolicitacao: solicitacao.idSolicitacao,
            tipo,
            colaboradorNome: colaborador?.nomeCompleto,
            cpf: colaborador?.cpf,
            cargo: colaborador?.cargo?.nomeCargo,
            setor: colaborador?.setor?.nomeSetor,
            turno: colaborador?.turno?.nomeTurno,
            lider: colaborador?.lider?.nomeCompleto,
            dataCriacao: solicitacao.dataCriacao,
            data: solicitacao.data,
            motivo: solicitacao.motivo,
          },
        });

        await prisma.solicitacaoOperacionalHistorico.create({
          data: { idSolicitacao: solicitacao.idSolicitacao, evento: "E-mails enviados aos aprovadores" },
        });
      }
    } catch (emailErr) {
      console.error("⚠️ Falha ao enviar email de solicitação operacional:", emailErr.message);
    }

    return createdResponse(res, solicitacao, "Solicitação criada com sucesso");
  } catch (err) {
    if (err instanceof HttpError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("❌ createSolicitacao (operacional):", err);
    return errorResponse(res, "Erro ao criar solicitação", 500);
  }
};

/* =====================================================
   APLICAR NO CONTROLE DE PRESENÇA (dentro da transação de aprovação)
===================================================== */
async function aplicarNaFrequencia(tx, solicitacao, registradoPor) {
  const tipos = await tx.tipoAusencia.findMany({
    where: { codigo: { in: ["FO", "BH", "S1", "DSR"] } },
    select: { idTipoAusencia: true, codigo: true },
  });
  const idPorCodigo = Object.fromEntries(tipos.map((t) => [t.codigo, t.idTipoAusencia]));

  async function upsertFrequencia(opsId, dataReferencia, idTipoAusencia, extra = {}) {
    await tx.frequencia.upsert({
      where: { opsId_dataReferencia: { opsId, dataReferencia } },
      update: { idTipoAusencia, manual: true, justificativa: "SOLICITACAO_OPERACIONAL", registradoPor, ...extra },
      create: { opsId, dataReferencia, idTipoAusencia, manual: true, justificativa: "SOLICITACAO_OPERACIONAL", registradoPor, ...extra },
    });
  }

  if (solicitacao.tipo === "FOLGA") {
    await upsertFrequencia(solicitacao.opsId, solicitacao.data, idPorCodigo.FO);
  } else if (solicitacao.tipo === "BANCO_HORAS") {
    if (solicitacao.bhDiaCompleto) {
      await upsertFrequencia(solicitacao.opsId, solicitacao.data, idPorCodigo.BH);
    } else {
      // Horas parciais: colaborador continua presente, só registra a hora de entrada
      const horaEntrada = solicitacao.bhHoraEntrada
        ? new Date(`1970-01-01T${solicitacao.bhHoraEntrada}:00Z`)
        : null;
      await upsertFrequencia(solicitacao.opsId, solicitacao.data, null, { horaEntrada });
    }
  } else if (solicitacao.tipo === "SINERGIA") {
    await upsertFrequencia(solicitacao.opsId, solicitacao.data, idPorCodigo.S1);
  } else if (solicitacao.tipo === "TROCA_DSR") {
    // Colaborador 1: nova data vira DSR; data atual deixa de ser DSR
    await upsertFrequencia(solicitacao.opsId, solicitacao.dsrDataNova1, idPorCodigo.DSR);
    await upsertFrequencia(solicitacao.opsId, solicitacao.dsrDataAtual1, null);
    // Colaborador 2: espelho
    await upsertFrequencia(solicitacao.opsId2, solicitacao.dsrDataNova2, idPorCodigo.DSR);
    await upsertFrequencia(solicitacao.opsId2, solicitacao.dsrDataAtual2, null);
  }
}

/* =====================================================
   APROVAR SOLICITAÇÃO
   Regra: o primeiro aprovador ativo que agir vence. Update
   condicional atômico (status = PENDENTE) evita corrida entre
   dois aprovadores agindo simultaneamente.
===================================================== */
exports.aprovarSolicitacao = async (req, res) => {
  try {
    const idSolicitacao = Number(req.params.id);

    const solicitacaoAtual = await prisma.solicitacaoOperacional.findUnique({
      where: { idSolicitacao },
      select: { colaborador: { select: { idEstacao: true } } },
    });

    if (!solicitacaoAtual || !pertenceAEstacaoDoUsuario(req, solicitacaoAtual.colaborador?.idEstacao)) {
      return notFoundResponse(res, "Solicitação não encontrada");
    }

    const autorizado = await isAprovadorAtivo(req.user.email, solicitacaoAtual.colaborador?.idEstacao);
    if (!autorizado) {
      return errorResponse(res, "Você não está cadastrado como aprovador.", 403);
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.solicitacaoOperacional.updateMany({
        where: { idSolicitacao, status: "PENDENTE" },
        data: { status: "APROVADA", decididoPorUserId: req.user.id, decididoEm: new Date() },
      });

      if (claimed.count === 0) {
        throw new HttpError("Esta solicitação já foi analisada por outro responsável.", 409);
      }

      const solicitacao = await tx.solicitacaoOperacional.findUnique({ where: { idSolicitacao } });

      await aplicarNaFrequencia(tx, solicitacao, req.user.id);

      await tx.solicitacaoOperacionalHistorico.createMany({
        data: [
          { idSolicitacao, evento: `Solicitação aprovada por ${req.user.name}` },
          { idSolicitacao, evento: "Controle de Presença atualizado automaticamente" },
        ],
      });
    });

    // E-mail ao solicitante — best-effort
    try {
      const solicitacao = await prisma.solicitacaoOperacional.findUnique({
        where: { idSolicitacao },
        include: { solicitante: { select: { email: true, name: true } }, colaborador: { select: { nomeCompleto: true } } },
      });
      if (solicitacao?.solicitante?.email) {
        await sendDecisaoOperacionalEmail({
          to: solicitacao.solicitante.email,
          solicitacao: { ...solicitacao, colaboradorNome: solicitacao.colaborador?.nomeCompleto },
          aprovada: true,
        });
        await prisma.solicitacaoOperacionalHistorico.create({
          data: { idSolicitacao, evento: "E-mail enviado ao solicitante" },
        });
      }
    } catch (emailErr) {
      console.error("⚠️ Falha ao enviar email de decisão (aprovação):", emailErr.message);
    }

    return successResponse(res, null, "Solicitação aprovada e Controle de Presença atualizado");
  } catch (err) {
    if (err instanceof HttpError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("❌ aprovarSolicitacao (operacional):", err);
    return errorResponse(res, "Erro ao aprovar solicitação", 500);
  }
};

/* =====================================================
   REPROVAR SOLICITAÇÃO
===================================================== */
exports.reprovarSolicitacao = async (req, res) => {
  try {
    const idSolicitacao = Number(req.params.id);
    const { motivo } = req.body;

    if (!motivo?.trim()) {
      return errorResponse(res, "Motivo da reprovação é obrigatório", 400);
    }

    const solicitacaoAtual = await prisma.solicitacaoOperacional.findUnique({
      where: { idSolicitacao },
      select: { colaborador: { select: { idEstacao: true } } },
    });

    if (!solicitacaoAtual || !pertenceAEstacaoDoUsuario(req, solicitacaoAtual.colaborador?.idEstacao)) {
      return notFoundResponse(res, "Solicitação não encontrada");
    }

    const autorizado = await isAprovadorAtivo(req.user.email, solicitacaoAtual.colaborador?.idEstacao);
    if (!autorizado) {
      return errorResponse(res, "Você não está cadastrado como aprovador.", 403);
    }

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.solicitacaoOperacional.updateMany({
        where: { idSolicitacao, status: "PENDENTE" },
        data: {
          status: "REPROVADA",
          decididoPorUserId: req.user.id,
          decididoEm: new Date(),
          motivoReprovacao: motivo.trim(),
        },
      });

      if (claimed.count === 0) {
        throw new HttpError("Esta solicitação já foi analisada por outro responsável.", 409);
      }

      await tx.solicitacaoOperacionalHistorico.create({
        data: {
          idSolicitacao,
          evento: `Solicitação reprovada por ${req.user.name} — Motivo: ${motivo.trim()}`,
        },
      });
    });

    try {
      const solicitacao = await prisma.solicitacaoOperacional.findUnique({
        where: { idSolicitacao },
        include: { solicitante: { select: { email: true, name: true } }, colaborador: { select: { nomeCompleto: true } } },
      });
      if (solicitacao?.solicitante?.email) {
        await sendDecisaoOperacionalEmail({
          to: solicitacao.solicitante.email,
          solicitacao: { ...solicitacao, colaboradorNome: solicitacao.colaborador?.nomeCompleto },
          aprovada: false,
          motivoReprovacao: motivo.trim(),
        });
        await prisma.solicitacaoOperacionalHistorico.create({
          data: { idSolicitacao, evento: "E-mail enviado ao solicitante" },
        });
      }
    } catch (emailErr) {
      console.error("⚠️ Falha ao enviar email de decisão (reprovação):", emailErr.message);
    }

    return successResponse(res, null, "Solicitação reprovada");
  } catch (err) {
    if (err instanceof HttpError) {
      return errorResponse(res, err.message, err.statusCode);
    }
    console.error("❌ reprovarSolicitacao (operacional):", err);
    return errorResponse(res, "Erro ao reprovar solicitação", 500);
  }
};
