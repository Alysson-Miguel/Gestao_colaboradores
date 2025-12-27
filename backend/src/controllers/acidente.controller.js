/**
 * Controller de Acidentes de Trabalho
 */

const { prisma } = require("../config/database");
const {
  successResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/response");

const crypto = require("crypto");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getR2Client } = require("../services/r2");

const BUCKET = process.env.R2_BUCKET_NAME;

/* ================= UTIL ================= */

function normalizeDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function normalizeTimeOnly(timeStr) {
  if (!timeStr) return null;
  return new Date(`1970-01-01T${timeStr}:00`);
}

/* ================= PRESIGN UPLOAD ================= */
const presignUpload = async (req, res) => {
  try {
    console.log("🔍 Body recebido no presignUpload:", req.body); // DEBUG: Log do body inteiro
    console.log("🔍 Tipo de req.body:", typeof req.body); // DEBUG: Verifica se é object
    console.log("🔍 req.body.opsId:", req.body.opsId, "tipo:", typeof req.body.opsId); // DEBUG
    console.log("🔍 req.body.files:", req.body.files, "é array?", Array.isArray(req.body.files)); // DEBUG

    const { opsId, files } = req.body;

    if (!opsId) {
      console.log("❌ Erro: opsId ausente ou falsy"); // DEBUG
      return errorResponse(res, "OPS ID não informado", 400);
    }

    if (!Array.isArray(files)) {
      console.log("❌ Erro: files não é um array válido"); // DEBUG
      return errorResponse(res, "Files não é um array válido", 400);
    }

    if (files.length === 0) {
      console.log("❌ Erro: Nenhum arquivo no array files"); // DEBUG
      return errorResponse(res, "Nenhum arquivo informado", 400);
    }

    if (files.length > 5) {
      console.log("❌ Erro: Mais de 5 arquivos"); // DEBUG
      return errorResponse(res, "Máximo de 5 fotos permitido", 400);
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { opsId },
    });

    if (!colaborador) {
      console.log("❌ Erro: Colaborador não encontrado para opsId:", opsId); // DEBUG
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    console.log("✅ Colaborador encontrado:", colaborador.opsId); // DEBUG

    const r2 = getR2Client();

    const uploads = await Promise.all(
      files.map(async ({ filename, contentType, size }) => {
        console.log("Processando arquivo:", { filename, contentType, size }); // DEBUG

        const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

        if (!allowed.includes(contentType)) {
          console.log("❌ Formato inválido:", contentType); // DEBUG
          throw new Error("Formato de imagem não permitido");
        }

        if (size > 5 * 1024 * 1024) {
          console.log("❌ Tamanho excede 5MB:", size); // DEBUG
          throw new Error("Imagem excede 5MB");
        }

        const id = crypto.randomUUID();
        const key = `acidentes/${opsId}/${id}-${filename}`;

        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

        console.log("✅ URL gerada para:", key); // DEBUG

        return { key, uploadUrl };
      })
    );

    console.log("✅ Uploads gerados com sucesso:", uploads.length, "arquivos"); // DEBUG
    return successResponse(res, uploads);
  } catch (err) {
    console.error("❌ PRESIGN UPLOAD ACIDENTE:", err);
    return errorResponse(res, err.message || "Erro no upload", 500);
  }
};

/* ================= PRESIGN DOWNLOAD ================= */
const presignDownload = async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return errorResponse(res, "Chave não informada", 400);

    const r2 = getR2Client();

    const command = GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 600 });

    return successResponse(res, { url });
  } catch (err) {
    console.error("❌ DOWNLOAD ACIDENTE:", err);
    return errorResponse(res, "Erro ao gerar download", 500);
  }
};

/* ================= CREATE ================= */
const createAcidente = async (req, res) => {
  try {
    const {
      opsId,
      nomeRegistrante,
      setor,
      cargo,
      participouIntegracao,
      tipoOcorrencia,
      dataOcorrencia,
      horarioOcorrencia,
      dataComunicacaoHSE,
      localOcorrencia,
      situacaoGeradora,
      agenteCausador,
      parteCorpoAtingida,
      lateralidade,
      tipoLesao,
      acoesImediatas,
      evidencias = [],
    } = req.body;

    if (!opsId || !nomeRegistrante || !dataOcorrencia || !tipoOcorrencia) {
      return errorResponse(res, "Campos obrigatórios não preenchidos", 400);
    }

    const colaborador = await prisma.colaborador.findUnique({
      where: { opsId },
    });

    if (!colaborador) {
      return notFoundResponse(res, "Colaborador não encontrado");
    }

    const acidente = await prisma.acidenteTrabalho.create({
      data: {
        opsIdColaborador: opsId,
        registradoPor: nomeRegistrante,
        setor,
        cargo,
        participouIntegracao,
        tipoOcorrencia,
        dataOcorrencia: normalizeDateOnly(dataOcorrencia),
        horarioOcorrencia: normalizeTimeOnly(horarioOcorrencia),
        dataComunicacaoHSE: dataComunicacaoHSE
          ? normalizeDateOnly(dataComunicacaoHSE)
          : null,
        localOcorrencia,
        situacaoGeradora,
        agenteCausador,
        parteCorpoAtingida,
        lateralidade,
        tipoLesao,
        acoesImediatas,
        evidencias: {
          create: evidencias.map((key) => ({
            arquivoUrl: key,
          })),
        },
      },
    });

    return createdResponse(res, acidente, "Acidente registrado com sucesso");
  } catch (err) {
    console.error("❌ CREATE ACIDENTE:", err);
    return errorResponse(res, "Erro ao registrar acidente", 500);
  }
};

/* ================= GET ALL ================= */
const getAllAcidentes = async (req, res) => {
  try {
    const { opsId } = req.query;

    const where = opsId
      ? { opsIdColaborador: opsId }
      : {};

    const acidentes = await prisma.acidenteTrabalho.findMany({
      where,
      orderBy: { dataOcorrencia: "desc" },
      include: {
        evidencias: true,
      },
    });

    return successResponse(res, acidentes);
  } catch (err) {
    console.error("❌ GET ACIDENTES:", err);
    return errorResponse(res, "Erro ao buscar acidentes", 500);
  }
};


/* ================= GET BY ID ================= */
const getAcidenteById = async (req, res) => {
  try {
    const { id } = req.params;

    const acidente = await prisma.acidenteTrabalho.findUnique({
      where: { idAcidente: Number(id) },
      include: {
        colaborador: true,
        evidencias: true,
      },
    });

    if (!acidente) {
      return notFoundResponse(res, "Acidente não encontrado");
    }

    return successResponse(res, acidente);
  } catch (err) {
    return errorResponse(res, "Erro ao buscar acidente", 500);
  }
};
/* ================= GET BY COLABORADOR ================= */
const getAcidentesByColaborador = async (req, res) => {
  try {
    const { opsId } = req.params;

    const acidentes = await prisma.acidenteTrabalho.findMany({
      where: {
        opsIdColaborador: opsId,
      },
      orderBy: {
        dataOcorrencia: "desc",
      },
      include: {
        evidencias: true,
      },
    });

    return successResponse(res, acidentes);
  } catch (err) {
    console.error("❌ GET ACIDENTES POR COLABORADOR:", err);
    return errorResponse(res, "Erro ao buscar acidentes do colaborador", 500);
  }
};

module.exports = {
  presignUpload,
  presignDownload,
  createAcidente,
  getAllAcidentes,
  getAcidenteById,
  getAcidentesByColaborador,
};