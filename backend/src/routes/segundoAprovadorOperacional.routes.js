const express = require("express");
const router = express.Router();

const controller = require("../controllers/segundoAprovadorOperacional.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

/* Tela restrita a ADMIN e ALTA_GESTAO — LIDERANCA não tem acesso */
const roles = ["ADMIN", "ALTA_GESTAO"];

/* LISTAR SEGUNDOS APROVADORES (RH / COORDENADOR) */
router.get(
  "/",
  authenticate,
  authorize(...roles),
  controller.listSegundosAprovadores
);

/* CRIAR SEGUNDO APROVADOR */
router.post(
  "/",
  authenticate,
  authorize(...roles),
  controller.createSegundoAprovador
);

/* ATUALIZAR SEGUNDO APROVADOR */
router.put(
  "/:id",
  authenticate,
  authorize(...roles),
  controller.updateSegundoAprovador
);

/* DESATIVAR SEGUNDO APROVADOR */
router.delete(
  "/:id",
  authenticate,
  authorize(...roles),
  controller.deleteSegundoAprovador
);

module.exports = router;
