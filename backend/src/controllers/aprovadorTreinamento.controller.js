/**
 * Controller de Aprovadores de Treinamento
 * Cadastro simples usado para autorizar quem pode aprovar/negar
 * Solicitações de Treinamento (vínculo por e-mail do usuário logado).
 */

const { prisma } = require("../config/database");
const {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/response");

/* =====================================================
   LISTAR APROVADORES
===================================================== */
exports.listAprovadores = async (req, res) => {
  try {
    const { ativo } = req.query;

    const where = {};
    if (ativo !== undefined) where.ativo = ativo === "true";

    const aprovadores = await prisma.aprovadorTreinamento.findMany({
      where,
      orderBy: { nome: "asc" },
    });

    return successResponse(res, aprovadores);
  } catch (err) {
    console.error("❌ listAprovadores:", err);
    return errorResponse(res, "Erro ao listar aprovadores", 500);
  }
};

/* =====================================================
   CRIAR APROVADOR
===================================================== */
exports.createAprovador = async (req, res) => {
  try {
    const { nome, email, ativo = true } = req.body;

    if (!nome?.trim() || !email?.trim()) {
      return errorResponse(res, "Nome e email são obrigatórios", 400);
    }

    const existente = await prisma.aprovadorTreinamento.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existente) {
      return errorResponse(res, "Já existe um aprovador com este email", 400);
    }

    const aprovador = await prisma.aprovadorTreinamento.create({
      data: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        ativo: !!ativo,
      },
    });

    return createdResponse(res, aprovador, "Aprovador cadastrado com sucesso");
  } catch (err) {
    console.error("❌ createAprovador:", err);
    return errorResponse(res, "Erro ao criar aprovador", 500);
  }
};

/* =====================================================
   ATUALIZAR APROVADOR
===================================================== */
exports.updateAprovador = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, ativo } = req.body;

    const aprovador = await prisma.aprovadorTreinamento.findUnique({
      where: { idAprovador: Number(id) },
    });

    if (!aprovador) {
      return notFoundResponse(res, "Aprovador não encontrado");
    }

    if (email && email.trim().toLowerCase() !== aprovador.email) {
      const existente = await prisma.aprovadorTreinamento.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existente) {
        return errorResponse(res, "Já existe um aprovador com este email", 400);
      }
    }

    const atualizado = await prisma.aprovadorTreinamento.update({
      where: { idAprovador: Number(id) },
      data: {
        ...(nome !== undefined ? { nome: nome.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(ativo !== undefined ? { ativo: !!ativo } : {}),
      },
    });

    return successResponse(res, atualizado, "Aprovador atualizado com sucesso");
  } catch (err) {
    console.error("❌ updateAprovador:", err);
    return errorResponse(res, "Erro ao atualizar aprovador", 500);
  }
};

/* =====================================================
   DESATIVAR (remover) APROVADOR
===================================================== */
exports.deleteAprovador = async (req, res) => {
  try {
    const { id } = req.params;

    const aprovador = await prisma.aprovadorTreinamento.findUnique({
      where: { idAprovador: Number(id) },
    });

    if (!aprovador) {
      return notFoundResponse(res, "Aprovador não encontrado");
    }

    await prisma.aprovadorTreinamento.update({
      where: { idAprovador: Number(id) },
      data: { ativo: false },
    });

    return successResponse(res, null, "Aprovador desativado com sucesso");
  } catch (err) {
    console.error("❌ deleteAprovador:", err);
    return errorResponse(res, "Erro ao desativar aprovador", 500);
  }
};
