/**
 * Configuração do Prisma Client
 * Gerencia a conexão com o banco de dados PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Instância única do Prisma Client (Singleton)
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ],
});

// Log de queries em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.info(`Query: ${e.query}`);
    logger.info(`Duration: ${e.duration}ms`);
  });
}

// Testa a conexão com o banco de dados
const testConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  }
};

// Fecha a conexão ao encerrar a aplicação
const disconnect = async () => {
  await prisma.$disconnect();
  logger.info('Conexão com o banco de dados encerrada.');
};

process.on('beforeExit', disconnect);
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

module.exports = { prisma, testConnection };
