const express = require("express");
const router = express.Router();

const solicitacaoController = require("../controllers/solicitacaoTreinamento.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

const roles = ["ADMIN", "ALTA_GESTAO", "LIDERANCA"];

/* CALENDÁRIO */
router.get("/calendario", authenticate, authorize(...roles), solicitacaoController.listarCalendario);

/* STATS (CARDS) */
router.get("/stats", authenticate, authorize(...roles), solicitacaoController.statsSolicitacoes);

/* STATS (GRÁFICOS) */
router.get("/stats-graficos", authenticate, authorize(...roles), solicitacaoController.statsGraficos);

/* VALIDAR CONFLITOS */
router.post("/validar-conflitos", authenticate, authorize(...roles), solicitacaoController.validarConflitos);

/* CRIAR SOLICITAÇÃO */
router.post("/", authenticate, authorize(...roles), solicitacaoController.createSolicitacao);

/* LISTAR SOLICITAÇÕES */
router.get("/", authenticate, authorize(...roles), solicitacaoController.listSolicitacoes);

/* BUSCAR SOLICITAÇÃO POR ID */
router.get("/:id", authenticate, authorize(...roles), solicitacaoController.getSolicitacao);

/* APROVAR SOLICITAÇÃO */
router.post("/:id/aprovar", authenticate, authorize(...roles), solicitacaoController.aprovarSolicitacao);

/* NEGAR SOLICITAÇÃO */
router.post("/:id/negar", authenticate, authorize(...roles), solicitacaoController.negarSolicitacao);

module.exports = router;
