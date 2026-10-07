const { successResponse, errorResponse, createdResponse } = require("../utils/response");
const svc = require("../services/sinergiaInterna/sinergiaInterna.service");
const { ErroNegocio } = require("../services/sinergiaInterna/base");

/* =====================================================
   Sinergia Interna (Label) — camada HTTP fina.
   Toda regra mora no service; aqui só extrai o contexto e traduz erros.
===================================================== */

const ator = (req) => ({
  user: req.user,
  idEstacao: req.dbContext?.estacaoId ?? 1,
  ip: req.ip || null,
  dispositivo: (req.get("user-agent") || "").slice(0, 255) || null,
});

const tratar = (descricao, fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    if (err instanceof ErroNegocio) return errorResponse(res, err.message, err.status);
    console.error(`❌ Sinergia interna — ${descricao}:`, err);
    return errorResponse(res, `Erro ao ${descricao}`, 500);
  }
};

const lista = (valor) =>
  String(valor || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

exports.metadados = tratar("carregar dados do módulo", async (req, res) => {
  return successResponse(res, await svc.metadados(ator(req)));
});

exports.buscarColaboradores = tratar("buscar colaboradores", async (req, res) => {
  const { idEstacao } = ator(req);
  return successResponse(res, await svc.buscarColaboradores({ idEstacao, search: req.query.search }));
});

exports.listar = tratar("listar sinergias", async (req, res) => {
  const q = req.query;
  return successResponse(res, await svc.listar({ ...q, status: lista(q.status) }, ator(req)));
});

exports.detalhe = tratar("carregar sinergia", async (req, res) => {
  return successResponse(res, await svc.detalhe(req.params.id, ator(req)));
});

exports.criar = tratar("criar sinergia", async (req, res) => {
  const criadas = await svc.criar(req.body || {}, ator(req));
  return createdResponse(res, criadas, criadas.length === 1 ? "Sinergia solicitada" : `${criadas.length} sinergias solicitadas`);
});

exports.enviar = tratar("confirmar envio", async (req, res) => {
  const a = ator(req);
  const { sinergia } = await svc.enviar(req.params.id, a);
  return successResponse(res, await svc.apresentar(sinergia, a), "Envio confirmado. QR Code gerado.");
});

exports.cancelar = tratar("cancelar sinergia", async (req, res) => {
  const a = ator(req);
  const { sinergia } = await svc.cancelar(req.params.id, req.body?.motivo, a);
  return successResponse(res, await svc.apresentar(sinergia, a), "Sinergia cancelada");
});

exports.finalizar = tratar("finalizar sinergia", async (req, res) => {
  const a = ator(req);
  const { sinergia } = await svc.finalizarNoDestino(req.params.id, a);
  return successResponse(res, await svc.apresentar(sinergia, a), "Sinergia finalizada. Aguardando o retorno físico.");
});

exports.prorrogar = tratar("prorrogar sinergia", async (req, res) => {
  const a = ator(req);
  const { sinergia } = await svc.prorrogar(req.params.id, req.body || {}, a);
  return successResponse(res, await svc.apresentar(sinergia, a), "Sinergia prorrogada");
});

exports.retornoManual = tratar("confirmar retorno manual", async (req, res) => {
  const a = ator(req);
  const { sinergia } = await svc.confirmarRetornoManual(req.params.id, req.body?.justificativa, a);
  return successResponse(res, await svc.apresentar(sinergia, a), "Retorno confirmado manualmente (registrado em auditoria)");
});

exports.reemitirQr = tratar("reemitir QR Code", async (req, res) => {
  const a = ator(req);
  const { sinergia } = await svc.reemitirQr(req.params.id, req.body?.tipo === "retorno" ? "retorno" : "ida", a);
  return successResponse(res, await svc.apresentar(sinergia, a), "Novo QR Code gerado. O anterior foi invalidado.");
});

exports.etiqueta = tratar("gerar etiqueta", async (req, res) => {
  const tipo = req.query.tipo === "retorno" ? "retorno" : "ida";
  return successResponse(res, await svc.obterEtiqueta(req.params.id, tipo, ator(req)));
});

exports.etiquetaGrupo = tratar("gerar etiqueta do grupo", async (req, res) => {
  const tipo = req.query.tipo === "retorno" ? "retorno" : "ida";
  return successResponse(res, await svc.obterEtiquetaGrupo(req.params.idLote, tipo, ator(req)));
});

exports.consultarQr = tratar("ler QR Code", async (req, res) => {
  return successResponse(res, await svc.consultarQr({ token: req.body?.token, modo: req.body?.modo }, ator(req)));
});

exports.confirmarQr = tratar("confirmar QR Code", async (req, res) => {
  const a = ator(req);
  const resultado = await svc.confirmarQr({ token: req.body?.token, modo: req.body?.modo }, a);
  if (resultado.grupo) return successResponse(res, resultado, resultado.mensagem);
  const { sinergia, mensagem, alocacoesEncerradas, alocadoEm } = resultado;
  return successResponse(res, { ...(await svc.apresentar(sinergia, a)), alocacoesEncerradas, alocadoEm }, mensagem);
});
