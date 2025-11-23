/**
 * Middleware de Validação
 * Processa erros de validação do express-validator
 */

const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware que processa os resultados da validação
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formata os erros
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return errorResponse(
      res,
      'Erro de validação',
      400,
      formattedErrors
    );
  }

  next();
};

module.exports = validate;
