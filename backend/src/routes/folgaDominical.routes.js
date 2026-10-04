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
  COMPLEMENTAR → ADMIN + ALTA_GESTAO
  (só elegíveis sem folga, só domingos futuros; não apaga o já gerado)
===================================================== */
router.post(
  "/complementar",
  authorizeRoles("ADMIN", "ALTA_GESTAO"),
  controller.complementar
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