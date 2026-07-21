const express = require("express");
const router = express.Router();

const aprovadorController = require("../controllers/aprovadorTreinamento.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

/* Tela restrita a ADMIN e ALTA_GESTAO — LIDERANCA não tem acesso */
const roles = ["ADMIN", "ALTA_GESTAO"];

/* LISTAR APROVADORES */
router.get(
  "/",
  authenticate,
  authorize(...roles),
  aprovadorController.listAprovadores
);

/* CRIAR APROVADOR */
router.post(
  "/",
  authenticate,
  authorize(...roles),
  aprovadorController.createAprovador
);

/* ATUALIZAR APROVADOR */
router.put(
  "/:id",
  authenticate,
  authorize(...roles),
  aprovadorController.updateAprovador
);

/* DESATIVAR APROVADOR */
router.delete(
  "/:id",
  authenticate,
  authorize(...roles),
  aprovadorController.deleteAprovador
);

module.exports = router;
