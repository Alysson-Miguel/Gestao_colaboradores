const express = require("express");
const router = express.Router();

const solicitacaoController = require("../controllers/solicitacaoOperacional.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const roles = ["ADMIN", "ALTA_GESTAO", "LIDERANCA"];

/* BUSCA INTELIGENTE POR CPF (autofill dos formulários) */
router.get("/colaborador", authenticate, authorize(...roles), solicitacaoController.buscarColaboradorPorCpf);

/* CALENDÁRIO */
router.get("/calendario", authenticate, authorize(...roles), solicitacaoController.listarCalendario);

/* STATS (CARDS) */
router.get("/stats", authenticate, authorize(...roles), solicitacaoController.statsSolicitacoes);

/* CRIAR SOLICITAÇÃO */
router.post("/", authenticate, authorize(...roles), solicitacaoController.createSolicitacao);

/* LISTAR SOLICITAÇÕES */
router.get("/", authenticate, authorize(...roles), solicitacaoController.listSolicitacoes);

/* BUSCAR SOLICITAÇÃO POR ID */
router.get("/:id", authenticate, authorize(...roles), solicitacaoController.getSolicitacao);

/* APROVAR SOLICITAÇÃO */
router.post("/:id/aprovar", authenticate, authorize(...roles), solicitacaoController.aprovarSolicitacao);

/* REPROVAR SOLICITAÇÃO */
router.post("/:id/reprovar", authenticate, authorize(...roles), solicitacaoController.reprovarSolicitacao);

module.exports = router;
