/**
 * Script para verificar se todas as variáveis de ambiente necessárias estão configuradas
 * Útil para diagnosticar problemas em produção
 */

require('dotenv').config();

console.log('\n🔍 Verificando Variáveis de Ambiente...\n');
console.log('='.repeat(60));

const requiredVars = {
  // Banco de Dados
  'DATABASE_URL': process.env.DATABASE_URL,
  'DATABASE_URL_ADMIN': process.env.DATABASE_URL_ADMIN,
  
  // JWT
  'JWT_SECRET': process.env.JWT_SECRET,
  'JWT_EXPIRES_IN': process.env.JWT_EXPIRES_IN,
  
  // Gmail (para envio de emails)
  'GMAIL_USER': process.env.GMAIL_USER,
  'GMAIL_APP_PASSWORD': process.env.GMAIL_APP_PASSWORD,
  
  // R2 (Cloudflare - para armazenamento de arquivos)
  'R2_ACCESS_KEY_ID': process.env.R2_ACCESS_KEY_ID,
  'R2_SECRET_ACCESS_KEY': process.env.R2_SECRET_ACCESS_KEY,
  'R2_ACCOUNT_ID': process.env.R2_ACCOUNT_ID,
  'R2_BUCKET_NAME': process.env.R2_BUCKET_NAME,
  'R2_ENDPOINT': process.env.R2_ENDPOINT,
  
  // Google Sheets
  'GOOGLE_CLIENT_EMAIL': process.env.GOOGLE_CLIENT_EMAIL,
  'GOOGLE_PRIVATE_KEY': process.env.GOOGLE_PRIVATE_KEY,
};

let allConfigured = true;
let missingVars = [];
let configuredVars = [];

Object.entries(requiredVars).forEach(([key, value]) => {
  const isConfigured = value && value.trim() !== '';
  
  if (isConfigured) {
    // Mascarar valores sensíveis
    let displayValue = value;
    if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')) {
      displayValue = value.substring(0, 4) + '***' + value.substring(value.length - 4);
    } else if (key.includes('URL')) {
      // Mascarar senha na URL do banco
      displayValue = value.replace(/:[^:@]+@/, ':***@');
    } else if (value.length > 50) {
      displayValue = value.substring(0, 30) + '...' + value.substring(value.length - 10);
    }
    
    console.log(`✅ ${key.padEnd(25)} = ${displayValue}`);
    configuredVars.push(key);
  } else {
    console.log(`❌ ${key.padEnd(25)} = NÃO CONFIGURADA`);
    missingVars.push(key);
    allConfigured = false;
  }
});

console.log('='.repeat(60));
console.log(`\n📊 Resumo:`);
console.log(`   ✅ Configuradas: ${configuredVars.length}`);
console.log(`   ❌ Faltando: ${missingVars.length}`);

if (!allConfigured) {
  console.log('\n⚠️  ATENÇÃO: Algumas variáveis obrigatórias não estão configuradas!');
  console.log('\n📝 Variáveis faltando:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Solução:');
  console.log('   1. Se estiver em localhost: configure no arquivo .env');
  console.log('   2. Se estiver no Render: configure no painel Environment Variables');
  console.log('   3. Após configurar, reinicie o servidor\n');
  process.exit(1);
} else {
  console.log('\n✅ Todas as variáveis obrigatórias estão configuradas!\n');
  process.exit(0);
}
