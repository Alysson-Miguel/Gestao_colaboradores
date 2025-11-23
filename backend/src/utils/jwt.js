/**
 * Utilitários JWT
 * Geração e verificação de tokens de autenticação
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Gera um token JWT
 * @param {Object} payload - Dados a serem codificados no token
 * @returns {String} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifica e decodifica um token JWT
 * @param {String} token - Token a ser verificado
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
};

/**
 * Decodifica um token sem verificar (útil para debugging)
 * @param {String} token - Token a ser decodificado
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
