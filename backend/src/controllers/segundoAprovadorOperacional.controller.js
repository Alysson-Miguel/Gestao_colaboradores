/**
 * Controller da Segunda Etapa de Aprovação de Solicitações Operacionais.
 * RH confirma Troca de Escala e Troca de DSR; Coordenador confirma Folga,
 * Banco de Horas, Hora Extra, Troca de Gestão e Desligamento. Sinergia não
 * tem segunda etapa. Cadastro por e-mail (informado manualmente, não é
 * derivado do cargo do colaborador).
 *
 * Multi-tenancy: cada aprovador pertence a uma estação (idEstacao).
 * Só o Admin pode cadastrar/editar um aprovador válido em "todas as
 * estações" (idEstacao = null) — os demais papéis ficam sempre
 * travados na própria estação (req.dbContext.estacaoId).
 */

const { prisma } = require("../config/database");
const {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/response");

const TIPOS_VALIDOS = ["RH", "COORDENADOR"];

function estacaoWhereAprovador(req) {
  return !req.dbContext?.isGlobal && req.dbContext?.estacaoId
    ? { OR: [{ idEstacao: req.dbContext.estacaoId }, { idEstacao: null }] }
    : {};
}

/** Resolve o idEstacao a gravar em create/update a partir do papel do usuário. */
function resolverIdEstacao(req, { idEstacaoAtual } = {}) {
  const isAdmin = req.user.role === "ADMIN";
  const informouIdEstacao = Object.prototype.hasOwnProperty.call(req.body, "idEstacao");

  if (isAdmin) {
    if (!informouIdEstacao) return { ok: true, value: idEstacaoAtual ?? null };
    const raw = req.body.idEstacao;
    const value = raw === null || raw === "" ? null : Number(raw);
    return { ok: true, value };
  }

  // Não-admin: sempre travado na própria estação, nunca pode ficar "global"
  const idEstacao = req.dbContext?.estacaoId ?? null;
  if (!idEstacao) {
    return { ok: false, message: "Selecione uma estação para o aprovador" };
  }
  return { ok: true, value: idEstacao };
}

/** true se o usuário pode ver/gerenciar este aprovador específico. */
function dentroDoEscopo(req, aprovador) {
  if (req.user.role === "ADMIN") return true;
  return !req.dbContext?.isGlobal && aprovador.idEstacao === req.dbContext?.estacaoId;
}

/* =====================================================
   LISTAR SEGUNDOS APROVADORES
===================================================== */
exports.listSegundosAprovadores = async (req, res) => {
  try {
    const { ativo, tipo } = req.query;

    const where = { ...estacaoWhereAprovador(req) };
    if (ativo !== undefined) where.ativo = ativo === "true";
    if (tipo && TIPOS_VALIDOS.includes(tipo)) where.tipo = tipo;

    const aprovadores = await prisma.segundoAprovadorOperacional.findMany({
      where,
      include: { estacao: { select: { idEstacao: true, nomeEstacao: true } } },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    });

    return successResponse(res, aprovadores);
  } catch (err) {
    console.error("❌ listSegundosAprovadores:", err);
    return errorResponse(res, "Erro ao listar segundos aprovadores", 500);
  }
};

/* =====================================================
   CRIAR SEGUNDO APROVADOR
===================================================== */
exports.createSegundoAprovador = async (req, res) => {
  try {
    const { tipo, nome, email, ativo = true } = req.body;

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return errorResponse(res, "Tipo inválido. Use RH ou COORDENADOR", 400);
    }
    if (!nome?.trim() || !email?.trim()) {
      return errorResponse(res, "Nome e email são obrigatórios", 400);
    }

    const resolucao = resolverIdEstacao(req);
    if (!resolucao.ok) {
      return errorResponse(res, resolucao.message, 400);
    }

    const existente = await prisma.segundoAprovadorOperacional.findFirst({
      where: { tipo, email: email.trim().toLowerCase(), idEstacao: resolucao.value },
    });
    if (existente) {
      return errorResponse(res, "Já existe um aprovador com este email para esse tipo e estação", 400);
    }

    const aprovador = await prisma.segundoAprovadorOperacional.create({
      data: {
        tipo,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        ativo: !!ativo,
        idEstacao: resolucao.value,
      },
      include: { estacao: { select: { idEstacao: true, nomeEstacao: true } } },
    });

    return createdResponse(res, aprovador, "Aprovador cadastrado com sucesso");
  } catch (err) {
    console.error("❌ createSegundoAprovador:", err);
    return errorResponse(res, "Erro ao criar aprovador", 500);
  }
};

/* =====================================================
   ATUALIZAR SEGUNDO APROVADOR
===================================================== */
exports.updateSegundoAprovador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, ativo } = req.body;

    const aprovador = await prisma.segundoAprovadorOperacional.findUnique({
      where: { idAprovador: Number(id) },
    });

    if (!aprovador || !dentroDoEscopo(req, aprovador)) {
      return notFoundResponse(res, "Aprovador não encontrado");
    }

    const resolucao = resolverIdEstacao(req, { idEstacaoAtual: aprovador.idEstacao });
    if (!resolucao.ok) {
      return errorResponse(res, resolucao.message, 400);
    }

    if (email && email.trim().toLowerCase() !== aprovador.email) {
      const existente = await prisma.segundoAprovadorOperacional.findFirst({
        where: {
          tipo: aprovador.tipo,
          email: email.trim().toLowerCase(),
          idEstacao: resolucao.value,
          idAprovador: { not: Number(id) },
        },
      });
      if (existente) {
        return errorResponse(res, "Já existe um aprovador com este email para esse tipo e estação", 400);
      }
    }

    const atualizado = await prisma.segundoAprovadorOperacional.update({
      where: { idAprovador: Number(id) },
      data: {
        ...(nome !== undefined ? { nome: nome.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(ativo !== undefined ? { ativo: !!ativo } : {}),
        idEstacao: resolucao.value,
      },
      include: { estacao: { select: { idEstacao: true, nomeEstacao: true } } },
    });

    return successResponse(res, atualizado, "Aprovador atualizado com sucesso");
  } catch (err) {
    console.error("❌ updateSegundoAprovador:", err);
    return errorResponse(res, "Erro ao atualizar aprovador", 500);
  }
};

/* =====================================================
   DESATIVAR (remover) SEGUNDO APROVADOR
===================================================== */
exports.deleteSegundoAprovador = async (req, res) => {
  try {
    const { id } = req.params;

    const aprovador = await prisma.segundoAprovadorOperacional.findUnique({
      where: { idAprovador: Number(id) },
    });

    if (!aprovador || !dentroDoEscopo(req, aprovador)) {
      return notFoundResponse(res, "Aprovador não encontrado");
    }

    await prisma.segundoAprovadorOperacional.update({
      where: { idAprovador: Number(id) },
      data: { ativo: false },
    });

    return successResponse(res, null, "Aprovador desativado com sucesso");
  } catch (err) {
    console.error("❌ deleteSegundoAprovador:", err);
    return errorResponse(res, "Erro ao desativar aprovador", 500);
  }
};
