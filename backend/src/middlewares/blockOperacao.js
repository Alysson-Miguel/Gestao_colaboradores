module.exports = function blockOperacao(req, res, next) {
  if (req.user && req.user.role === "OPERACAO") {
    if (
      req.originalUrl.startsWith("/ponto") ||
      req.originalUrl.startsWith("/auth")
    ) {
      return next();
    }

    return res.status(403).json({
      message: "Acesso restrito para perfil Operação",
    });
  }

  next();
};
