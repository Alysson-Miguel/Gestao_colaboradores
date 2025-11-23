/**
 * Controller de Autenticação
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
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

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
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return errorResponse(res, 'Email ou senha incorretos', 401);
  }

  if (!user.isActive) {
    return errorResponse(res, 'Usuário inativo', 401);
  }

  // Verifica a senha
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return errorResponse(res, 'Email ou senha incorretos', 401);
  }

  // Gera token JWT
  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  // Remove a senha do objeto de resposta
  const { password: _, ...userWithoutPassword } = user;

  return successResponse(res, { user: userWithoutPassword, token }, 'Login realizado com sucesso');
};

/**
 * Retorna dados do usuário autenticado
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return successResponse(res, user, 'Dados do usuário recuperados com sucesso');
};

/**
 * Atualiza dados do usuário autenticado
 * PUT /api/auth/me
 */
const updateMe = async (req, res) => {
  const { name, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name }),
      ...(avatar && { avatar }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return successResponse(res, user, 'Dados atualizados com sucesso');
};

/**
 * Altera senha do usuário autenticado
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Busca o usuário com a senha
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  // Verifica a senha atual
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    return errorResponse(res, 'Senha atual incorreta', 400);
  }

  // Hash da nova senha
  const hashedPassword = await hashPassword(newPassword);

  // Atualiza a senha
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  return successResponse(res, null, 'Senha alterada com sucesso');
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
};
