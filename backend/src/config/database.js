/**
 * Configuração do Prisma Client
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.info(`Query: ${e.query} | Duration: ${e.duration}ms`);
  });
}

const testConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    logger.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  }
};

const disconnect = async () => {
  await prisma.$disconnect();
  logger.info('Conexão com o banco de dados encerrada.');
};

process.on('beforeExit', disconnect);
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

module.exports = { prisma, testConnection };
