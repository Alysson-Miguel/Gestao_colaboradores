/**
 * Configura CORS no bucket R2 para permitir upload direto do browser
 * Executar: node scripts/set-r2-cors.js
 */
require("dotenv").config();

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
  },
  requestChecksumCalculation: "NEVER",
  responseChecksumValidation: "NEVER",
});

const BUCKET = process.env.R2_BUCKET_NAME;

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: [
        "http://localhost:5173",
        "http://localhost:3000",
        // Adicione a URL de produção do frontend aqui se tiver
        // "https://seu-dominio.com",
      ],
      AllowedMethods: ["GET", "PUT", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function run() {
  try {
    console.log(`🔧 Configurando CORS no bucket: ${BUCKET}`);

    await r2.send(new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: corsConfig,
    }));

    console.log("✅ CORS configurado com sucesso!\n");

    // Confirma lendo de volta
    const result = await r2.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
    console.log("📋 Configuração atual:");
    console.log(JSON.stringify(result.CORSRules, null, 2));

  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

run();
