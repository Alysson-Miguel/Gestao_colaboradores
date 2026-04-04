/**
 * Middleware de Contexto de Estação
 * Injeta req.dbContext para uso nos controllers.
 * ADMIN e ALTA_GESTAO têm acesso global (sem filtro de estação),
 * mas podem filtrar por estação específica via ?estacaoId=X.
 */

const GLOBAL_ROLES = ['ADMIN', 'ALTA_GESTAO'];

const injectDbContext = (req, res, next) => {
  if (!req.user) return next();

  const isGlobal = GLOBAL_ROLES.includes(req.user.role);

  // ADMIN/ALTA_GESTAO podem filtrar por estação via query param
  const estacaoIdParam = req.query.estacaoId ? Number(req.query.estacaoId) : null;

  req.dbContext = {
    isGlobal: isGlobal && !estacaoIdParam, // se filtrou por estação, não é mais global
    estacaoId: isGlobal
      ? estacaoIdParam  // usa o param se veio, senão null (vê tudo)
      : req.user.idEstacao, // usuário normal usa a estação do perfil
  };

  next();
};

module.exports = { injectDbContext };
