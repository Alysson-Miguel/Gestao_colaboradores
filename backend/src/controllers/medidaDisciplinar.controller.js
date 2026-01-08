/**
 * Controller de Medida Disciplinar
 * Cloudflare R2 + Presigned URLs
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
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getR2Client } = require("../services/r2");

const BUCKET = process.env.R2_BUCKET_NAME;

/* ================= UTIL ================= */

function normalizeDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

/* ================= PRESIGN UPLOAD =================*/
const presignUpload = async (req, res) => {
  try {
    const { cpf, filename, contentType, size } = req.body;

    if (!BUCKET) {
      return errorResponse(res, 500, "R2_BUCKET_NAME não configurado");
    }

    if (!cpf || !filename || !contentType) {
      return errorResponse(
        res,
        400,
        "cpf, filename e contentType são obrigatórios"
      );
    }

    if (contentType !== "application/pdf") {
      return errorResponse(res, 400, "Apenas arquivos PDF são permitidos");
    }

    const maxBytes = 5 * 1024 * 1024;
    if (size && Number(size) > maxBytes) {
      return errorResponse(res, 400, "O PDF excede o limite de 5MB");
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      return errorResponse(res, 400, "CPF inválido");
    }


    const colaborador = await prisma.colaborador.findUnique({
      where: { cpf: cpfLimpo },
    });

    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    const opsId = colaborador.opsId;
    const id = crypto.randomUUID();
    const key = `medidas-disciplinares/${opsId}/${id}.pdf`;

    const r2 = getR2Client();

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: "application/pdf",
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    return successResponse(res, {
      key,
      uploadUrl,
      expiresIn: 300,
    });
  } catch (err) {
    console.error("❌ PRESIGN UPLOAD MD:", err);
    return errorResponse(res, 500, "Erro ao gerar URL de upload");
  }
};


/* ================= PRESIGN DOWNLOAD =================
GET /api/medidas-disciplinares/:id/presign-download
*/
const presignDownload = async (req, res) => {
  try {
    const { id } = req.params;

    if (!BUCKET) {
      return errorResponse(res, 500, "R2_BUCKET_NAME não configurado");
    }

    const medida = await prisma.medidaDisciplinar.findUnique({
      where: { idMedida: Number(id) },
    });

    if (!medida) {
      return notFoundResponse(res, "Medida disciplinar não encontrada");
    }

    if (!medida.documentoAnexo) {
      return errorResponse(res, 400, "Documento não encontrado para esta medida");
    }

    const r2 = getR2Client();

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: medida.documentoAnexo,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename="md-${id}.pdf"`,
    });

    const url = await getSignedUrl(r2, command, {
      expiresIn: 60 * 10, // 10 minutos
    });

    return successResponse(res, {
      url,
      expiresIn: 600,
    });
  } catch (err) {
    console.error("❌ PRESIGN DOWNLOAD MD:", err);
    return errorResponse(res, 500, "Erro ao gerar URL de download", err);
  }
};

/* ================= CREATE =================*/
const createMedida = async (req, res) => {
  try {
    const {
      cpf,
      dataAplicacao,
      tipoMedida,
      motivo,
      documentoKey,
    } = req.body;

    if (!cpf || !dataAplicacao || !tipoMedida || !motivo || !documentoKey) {
      return errorResponse(
        res,
        400,
        "Campos obrigatórios: cpf, dataAplicacao, tipoMedida, motivo e documentoKey"
      );
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    if (cpfLimpo.length !== 11) {
      return errorResponse(res, 400, "CPF inválido");
    }


    const colaborador = await prisma.colaborador.findUnique({
      where: { cpf: cpfLimpo },
    });

    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    const opsId = colaborador.opsId;

    const medida = await prisma.medidaDisciplinar.create({
      data: {
        opsId,
        dataAplicacao: normalizeDateOnly(dataAplicacao),
        tipoMedida,
        motivo,
        documentoAnexo: documentoKey,
      },
    });

    return createdResponse(
      res,
      medida,
      "Medida disciplinar registrada com sucesso"
    );
  } catch (err) {
    console.error("❌ CREATE MD:", err);
    return errorResponse(res, 500, "Erro ao criar medida disciplinar");
  }
};


/* ================= GET ALL ================= */
const getAllMedidas = async (req, res) => {
  try {
    const { opsId, cpf } = req.query;
    let where = {};

    if (opsId) where.opsId = opsId;

    if (cpf) {
      const cpfLimpo = cpf.replace(/\D/g, "");

      if (cpfLimpo.length !== 11) {
        return errorResponse(res, 400, "CPF inválido");
      }

      const colab = await prisma.colaborador.findUnique({
        where: { cpf: cpfLimpo },
      });

      if (!colab) return successResponse(res, []);
      where.opsId = colab.opsId;
    }

    const medidas = await prisma.medidaDisciplinar.findMany({
      where,
      orderBy: { dataAplicacao: "desc" },
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

    return successResponse(res, medidas);
  } catch (err) {
    console.error("❌ GET MD:", err);
    return errorResponse(res, 500, "Erro ao buscar medidas disciplinares");
  }
};


/* ================= GET BY ID ================= */
const getMedidaById = async (req, res) => {
  try {
    const { id } = req.params;

    const medida = await prisma.medidaDisciplinar.findUnique({
      where: { idMedida: Number(id) },
      include: { colaborador: true },
    });

    if (!medida) {
      return notFoundResponse(res, "Medida disciplinar não encontrada");
    }

    return successResponse(res, medida);
  } catch (err) {
    console.error("❌ GET MD BY ID:", err);
    return errorResponse(res, 500, "Erro ao buscar medida disciplinar", err);
  }
};

module.exports = {
  presignUpload,
  presignDownload,
  createMedida,
  getAllMedidas,
  getMedidaById,
};
