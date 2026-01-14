/**
 * Middleware de Autenticação JWT
 * Valida tokens e protege rotas
 */

const { verifyToken } = require('../utils/jwt');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/response');
const { prisma } = require('../config/database');

/**
 * Middleware que verifica se o usuário está autenticado
 */
const authenticate = async (req, res, next) => {
  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Token não fornecido');
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verifica e decodifica o token
    const decoded = verifyToken(token);

    // Busca o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        opsId: true,
      },
    });

    if (!user) {
      return unauthorizedResponse(res, 'Usuário não encontrado');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, 'Usuário inativo');
    }

    // Adiciona o usuário ao objeto request
    req.user = user;
    next();
  } catch (error) {
    return unauthorizedResponse(res, error.message || 'Token inválido');
  }
};

/**
 * Middleware que verifica se o usuário tem uma role específica
 * @param {Array} roles - Array de roles permitidas
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Usuário não autenticado');
    }

    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(
        res,
        'Você não tem permissão para acessar este recurso'
      );
    }

    next();
  };
};

/**
 * Middleware opcional - não retorna erro se não houver token
 * Usado para rotas que podem ser acessadas com ou sem autenticação
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignora erros e continua sem autenticação
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
};
