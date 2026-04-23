const { S3Client } = require("@aws-sdk/client-s3");

function getR2Client() {
  const {
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_REGION,
    R2_ENDPOINT,
  } = process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
    const missing = [];
    if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
    if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
    if (!R2_ENDPOINT) missing.push("R2_ENDPOINT");
    
    throw new Error(`Variáveis de ambiente do R2 não configuradas: ${missing.join(", ")}`);
  }

  // Validar formato das credenciais
  if (R2_ACCESS_KEY_ID.length < 10) {
    throw new Error("R2_ACCESS_KEY_ID parece inválida (muito curta)");
  }
  
  if (R2_SECRET_ACCESS_KEY.length < 20) {
    throw new Error("R2_SECRET_ACCESS_KEY parece inválida (muito curta)");
  }

  console.log(`🔧 Configurando R2 Client:`);
  console.log(`   - Endpoint: ${R2_ENDPOINT}`);
  console.log(`   - Access Key: ${R2_ACCESS_KEY_ID.substring(0, 4)}***${R2_ACCESS_KEY_ID.substring(R2_ACCESS_KEY_ID.length - 4)}`);
  console.log(`   - Region: ${R2_REGION || "auto"}`);

  return new S3Client({
    region: R2_REGION || "auto",
    endpoint: R2_ENDPOINT, // https://<accountid>.r2.cloudflarestorage.com
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "NEVER",
    responseChecksumValidation: "NEVER",
  });
}

module.exports = { getR2Client };
