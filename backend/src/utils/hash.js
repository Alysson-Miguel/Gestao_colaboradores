/**
 * Utilitários de Hash de Senha
 * Usando bcryptjs para criptografia
 */

const bcrypt = require('bcryptjs');

/**
 * Gera hash de uma senha
 * @param {String} password - Senha em texto plano
 * @returns {String} Senha com hash
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compara uma senha com seu hash
 * @param {String} password - Senha em texto plano
 * @param {String} hashedPassword - Senha com hash
 * @returns {Boolean} True se as senhas correspondem
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
