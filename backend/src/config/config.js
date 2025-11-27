/**
 * Configurações Gerais da Aplicação
 * Carrega e valida variáveis de ambiente
 */

require('dotenv').config();

const config = {
  // Configurações do Servidor
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Configurações do Banco de Dados
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // Configurações JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'seu-segredo-jwt-aqui',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Configurações de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
},

  
  // Configurações de Log
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  
  // Paginação padrão
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
};

// Validação de variáveis obrigatórias
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Variáveis de ambiente obrigatórias não definidas: ${missingEnvVars.join(', ')}`);
  console.error('Por favor, configure o arquivo .env');
  process.exit(1);
}

module.exports = config;
