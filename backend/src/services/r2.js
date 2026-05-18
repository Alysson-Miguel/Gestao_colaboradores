const { S3Client } = require("@aws-sdk/client-s3");

function getR2Client() {
  // .trim() em todas — protege contra espaços/quebras de linha no .env ou em variáveis de ambiente de prod
  const accessKeyId     = (process.env.R2_ACCESS_KEY_ID     || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  const endpoint        = (process.env.R2_ENDPOINT           || "").trim();
  const region          = (process.env.R2_REGION             || "auto").trim();

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    const missing = [];
    if (!accessKeyId)     missing.push("R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!endpoint)        missing.push("R2_ENDPOINT");
    throw new Error(`Variáveis de ambiente do R2 não configuradas: ${missing.join(", ")}`);
  }

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "NEVER",
    responseChecksumValidation: "NEVER",
  });
}

module.exports = { getR2Client };
