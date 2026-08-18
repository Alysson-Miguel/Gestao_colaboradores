const express = require("express");
const router = express.Router();

const controller = require("../controllers/folgaDominical.controller");
const { authorizeRoles } = require("../middlewares/authorizeRoles");

/* =====================================================
   👀 LISTAR → ADMIN + ALTA_GESTAO + LIDERANCA
===================================================== */
router.get(
  "/",
  authorizeRoles("ADMIN", "ALTA_GESTAO", "LIDERANCA"),
  controller.listar
);

/* =====================================================
  PREVIEW → ADMIN + ALTA_GESTAO
  (simulação sem salvar)
===================================================== */
router.post(
  "/preview",
  authorizeRoles("ADMIN", "ALTA_GESTAO"),
  controller.preview
);

/* =====================================================
  GERAR → ADMIN + ALTA_GESTAO
===================================================== */
router.post(
  "/",
  authorizeRoles("ADMIN", "ALTA_GESTAO"),
  controller.gerar
);

/* =====================================================
  DELETE (usado pelo "Reprocessar") → exclusivo ADMIN
===================================================== */
router.delete(
  "/",
  authorizeRoles("ADMIN"),
  controller.deletar
);

module.exports = router;