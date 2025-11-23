/**
 * Utilitários de Resposta HTTP
 * Padroniza as respostas da API
 */

/**
 * Resposta de sucesso
 * @param {Object} res - Response object do Express
 * @param {*} data - Dados a serem retornados
 * @param {String} message - Mensagem de sucesso
 * @param {Number} statusCode - Código HTTP (padrão: 200)
 */
const successResponse = (res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Resposta de erro
 * @param {Object} res - Response object do Express
 * @param {String} message - Mensagem de erro
 * @param {Number} statusCode - Código HTTP (padrão: 400)
 * @param {Array} errors - Array de erros detalhados
 */
const errorResponse = (res, message = 'Erro ao processar requisição', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Resposta de criação
 * @param {Object} res - Response object do Express
 * @param {*} data - Dados criados
 * @param {String} message - Mensagem de sucesso
 */
const createdResponse = (res, data, message = 'Recurso criado com sucesso') => {
  return successResponse(res, data, message, 201);
};

/**
 * Resposta de exclusão
 * @param {Object} res - Response object do Express
 * @param {String} message - Mensagem de sucesso
 */
const deletedResponse = (res, message = 'Recurso excluído com sucesso') => {
  return successResponse(res, null, message, 200);
};

/**
 * Resposta de não encontrado
 * @param {Object} res - Response object do Express
 * @param {String} message - Mensagem de erro
 */
const notFoundResponse = (res, message = 'Recurso não encontrado') => {
  return errorResponse(res, message, 404);
};

/**
 * Resposta de não autorizado
 * @param {Object} res - Response object do Express
 * @param {String} message - Mensagem de erro
 */
const unauthorizedResponse = (res, message = 'Não autorizado') => {
  return errorResponse(res, message, 401);
};

/**
 * Resposta de proibido
 * @param {Object} res - Response object do Express
 * @param {String} message - Mensagem de erro
 */
const forbiddenResponse = (res, message = 'Acesso negado') => {
  return errorResponse(res, message, 403);
};

/**
 * Resposta com paginação
 * @param {Object} res - Response object do Express
 * @param {Array} data - Dados paginados
 * @param {Object} pagination - Informações de paginação
 * @param {String} message - Mensagem de sucesso
 */
const paginatedResponse = (res, data, pagination, message = 'Dados recuperados com sucesso') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  deletedResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
};
