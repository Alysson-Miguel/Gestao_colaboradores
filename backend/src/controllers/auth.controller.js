/**
 * Controller de Autenticação - Ajustado
 * Gerencia login, registro e autenticação de usuários
 */

const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const {
  successResponse,
  errorResponse,
  createdResponse,
} = require('../utils/response');

/**
 * Registra um novo usuário
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Verifica se o email já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return errorResponse(res, 'Email já cadastrado', 409);
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password);

  // Cria o usuário
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'USER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Gera token JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return createdResponse(res, { user, token }, 'Usuário registrado com sucesso');
};

/**
 * Realiza login do usuário
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Busca o usuário
  const user = await prisma.user.findUnique({ where: { email } });

  // Valida existência do usuário e senha
  if (!user || !user.password) {
    return errorResponse(res, 'Email ou senha incorretos', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Usuário inativo', 401);
  }

  // Compara senha
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return errorResponse(res, 'Email ou senha incorretos', 401);
  }

  // Gera token JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Remove senha da resposta
  const { password: _, ...userWithoutPassword } = user;

  return successResponse(res, { user: userWithoutPassword, token }, 'Login realizado com sucesso');
};

module.exports = {
  register,
  login,
};
