/**
 * Middleware de Tratamento de Erros Global
 * Captura e formata todos os erros da aplicação
 */

const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Middleware de erro 404 - Rota não encontrada
 */
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware de tratamento de erros global
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error('Erro capturado:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Status code (usa o status definido ou 500 como padrão)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Tratamento específico para erros do Prisma
  if (err.code) {
    return handlePrismaError(err, res);
  }

  // Resposta de erro
  const response = {
    success: false,
    message: err.message || 'Erro interno do servidor',
  };

  // Em desenvolvimento, inclui a stack trace
  if (config.env === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(statusCode).json(response);
};

/**
 * Trata erros específicos do Prisma
 */
const handlePrismaError = (err, res) => {
  logger.error('Erro do Prisma:', err);

  const response = {
    success: false,
    message: 'Erro no banco de dados',
  };

  // Prisma Error Codes
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      response.message = `Já existe um registro com este ${err.meta?.target?.[0] || 'valor'}`;
      return res.status(409).json(response);

    case 'P2025':
      // Record not found
      response.message = 'Registro não encontrado';
      return res.status(404).json(response);

    case 'P2003':
      // Foreign key constraint failed
      response.message = 'Relacionamento inválido ou registro vinculado não existe';
      return res.status(400).json(response);

    case 'P2014':
      // Required relation violation
      response.message = 'A operação viola um relacionamento obrigatório';
      return res.status(400).json(response);

    case 'P2000':
      // Value too long
      response.message = 'Valor muito longo para o campo';
      return res.status(400).json(response);

    case 'P2001':
      // Record searched for does not exist
      response.message = 'O registro procurado não existe';
      return res.status(404).json(response);

    default:
      if (config.env === 'development') {
        response.error = err;
        response.code = err.code;
      }
      return res.status(500).json(response);
  }
};

/**
 * Wrapper async para tratamento de erros em controllers
 * Evita try-catch em todas as funções async
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
};
