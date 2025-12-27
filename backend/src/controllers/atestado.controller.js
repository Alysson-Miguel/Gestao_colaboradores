/**
 * Controller de Atestado Médico (Cloudflare R2 + Presigned URLs)
 */

const { prisma } = require("../config/database");
const {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/response");

const crypto = require("crypto");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getR2Client } = require("../services/r2");

const BUCKET = process.env.R2_BUCKET_NAME;

/* ================= UTIL ================= */

function normalizeDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function calcDias(dataInicio, dataFim) {
  const ini = normalizeDateOnly(dataInicio);
  const fim = normalizeDateOnly(dataFim);
  const diff = Math.floor(
    (fim.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff + 1;
}

/* ================= PRESIGN UPLOAD =================
   POST /api/atestados-medicos/presign-upload
   body: { opsId, filename, contentType, size }
*/
const presignUpload = async (req, res) => {
  try {
    const { opsId, filename, contentType, size } = req.body;

    if (!BUCKET) {
      return errorResponse(res, 500, "R2_BUCKET_NAME não configurado");
    }

    if (!opsId || !filename || !contentType) {
      return errorResponse(
        res,
        400,
        "opsId, filename e contentType são obrigatórios"
      );
    }

    if (contentType !== "application/pdf") {
      return errorResponse(res, 400, "Apenas arquivos PDF são permitidos");
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (size && Number(size) > maxBytes) {
      return errorResponse(res, 400, "O PDF excede o limite de 5MB");
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { opsId },
    });
    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    const id = crypto.randomUUID();
    const key = `atestados/${opsId}/${id}.pdf`;

    const r2 = getR2Client();
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: "application/pdf",
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 60 * 5, // 5 minutos
    });

    return successResponse(res, {
      key,
      uploadUrl,
      expiresIn: 300,
    });
  } catch (err) {
    console.error("❌ PRESIGN UPLOAD:", err);
    return errorResponse(res, 500, "Erro ao gerar URL de upload", err);
  }
};

/* ================= PRESIGN DOWNLOAD =================
   GET /api/atestados-medicos/:id/presign-download
*/
const presignDownload = async (req, res) => {
  try {
    const { id } = req.params;

    if (!BUCKET) {
      return errorResponse(res, 500, "R2_BUCKET_NAME não configurado");
    }

    const atestado = await prisma.atestadoMedico.findUnique({
      where: { idAtestado: Number(id) },
      include: {
        colaborador: {
          select: { opsId: true, nomeCompleto: true },
        },
      },
    });

    if (!atestado) {
      return notFoundResponse(res, "Atestado não encontrado");
    }

    if (!atestado.documentoAnexo) {
      return errorResponse(res, 400, "Atestado não possui documento");
    }

    const r2 = getR2Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: atestado.documentoAnexo,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename="atestado-${atestado.idAtestado}.pdf"`,
    });

    const url = await getSignedUrl(r2, command, {
      expiresIn: 60 * 10, // 10 minutos
    });

    return successResponse(res, {
      url,
      expiresIn: 600,
    });
  } catch (err) {
    console.error("❌ PRESIGN DOWNLOAD:", err);
    return errorResponse(res, 500, "Erro ao gerar URL de download", err);
  }
};

/* ================= CREATE =================
   POST /api/atestados-medicos
*/
const createAtestado = async (req, res) => {
  try {
    const {
      opsId,
      dataInicio,
      dataFim,
      cid,
      observacao,
      documentoKey,
      diasAfastamento,
    } = req.body;

    if (!opsId || !dataInicio || !dataFim || !documentoKey) {
      return errorResponse(
        res,
        400,
        "opsId, datas e documento PDF são obrigatórios"
      );
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { opsId },
    });
    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    const dias =
      diasAfastamento && Number(diasAfastamento) > 0
        ? Number(diasAfastamento)
        : calcDias(dataInicio, dataFim);

    const atestado = await prisma.atestadoMedico.create({
      data: {
        opsId,
        dataInicio: normalizeDateOnly(dataInicio),
        dataFim: normalizeDateOnly(dataFim),
        diasAfastamento: dias,
        cid: cid || null,
        observacao: observacao || null,
        documentoAnexo: documentoKey,
        status: "ATIVO",
      },
    });

    return createdResponse(res, atestado, "Atestado criado com sucesso");
  } catch (err) {
    console.error("❌ CREATE ATESTADO:", err);
    return errorResponse(res, 500, "Erro ao criar atestado", err);
  }
};

/* ================= GET ALL ================= */
const getAllAtestados = async (req, res) => {
  try {
    const { opsId } = req.query;
    const where = opsId ? { opsId } : {};

    const atestados = await prisma.atestadoMedico.findMany({
      where,
      orderBy: { dataInicio: "desc" },
      include: {
        colaborador: {
          select: {
            opsId: true,
            nomeCompleto: true,
            matricula: true,
          },
        },
      },
    });

    return successResponse(res, atestados);
  } catch (err) {
    console.error("❌ GET ATESTADOS:", err);
    return errorResponse(res, 500, "Erro ao buscar atestados", err);
  }
};

/* ================= GET BY ID ================= */
const getAtestadoById = async (req, res) => {
  try {
    const { id } = req.params;

    const atestado = await prisma.atestadoMedico.findUnique({
      where: { idAtestado: Number(id) },
      include: { colaborador: true },
    });

    if (!atestado) {
      return notFoundResponse(res, "Atestado não encontrado");
    }

    return successResponse(res, atestado);
  } catch (err) {
    return errorResponse(res, 500, "Erro ao buscar atestado", err);
  }
};

/* ================= UPDATE ================= */
const updateAtestado = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.dataInicio) data.dataInicio = normalizeDateOnly(data.dataInicio);
    if (data.dataFim) data.dataFim = normalizeDateOnly(data.dataFim);

    if (data.documentoKey) {
      data.documentoAnexo = data.documentoKey;
      delete data.documentoKey;
    }

    const atestado = await prisma.atestadoMedico.update({
      where: { idAtestado: Number(id) },
      data,
    });

    return successResponse(res, atestado, "Atestado atualizado com sucesso");
  } catch (err) {
    return errorResponse(res, 500, "Erro ao atualizar atestado", err);
  }
};

/* ================= FINALIZAR ================= */
const finalizarAtestado = async (req, res) => {
  try {
    const { id } = req.params;

    const atestado = await prisma.atestadoMedico.update({
      where: { idAtestado: Number(id) },
      data: { status: "FINALIZADO" },
    });

    return successResponse(res, atestado, "Atestado finalizado");
  } catch (err) {
    return errorResponse(res, 500, "Erro ao finalizar atestado", err);
  }
};

/* ================= CANCELAR ================= */
const cancelarAtestado = async (req, res) => {
  try {
    const { id } = req.params;

    const atestado = await prisma.atestadoMedico.update({
      where: { idAtestado: Number(id) },
      data: { status: "CANCELADO" },
    });

    return successResponse(res, atestado, "Atestado cancelado");
  } catch (err) {
    return errorResponse(res, 500, "Erro ao cancelar atestado", err);
  }
};

module.exports = {
  presignUpload,
  presignDownload,
  createAtestado,
  getAllAtestados,
  getAtestadoById,
  updateAtestado,
  finalizarAtestado,
  cancelarAtestado,
};
