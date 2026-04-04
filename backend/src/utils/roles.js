/**
 * Helpers de autorização por role
 * ADMIN e ALTA_GESTAO têm acesso global entre estações (bypass RLS)
 */
const { authorizeRoles } = require('../middlewares/authorizeRoles');

// Roles com visão global (bypass RLS)
const GLOBAL_ROLES = ['ADMIN', 'ALTA_GESTAO'];

const onlyAdmin = authorizeRoles('ADMIN');

const adminOrAltaGestao = authorizeRoles('ADMIN', 'ALTA_GESTAO');

const adminAltaGestaoLideranca = authorizeRoles('ADMIN', 'ALTA_GESTAO', 'LIDERANCA');

const allRoles = authorizeRoles('ADMIN', 'ALTA_GESTAO', 'LIDERANCA', 'OPERACAO');

module.exports = {
  GLOBAL_ROLES,
  onlyAdmin,
  adminOrAltaGestao,
  adminAltaGestaoLideranca,
  allRoles,
};
