const express = require("express");
const router = express.Router();

const controller = require("../controllers/folgaDominical.controller");
const { authorizeRoles } = require("../middlewares/authorizeRoles");

/* =====================================================
   👀 LISTAR → ADMIN + LIDERANCA
===================================================== */
router.get(
  "/",
  authorizeRoles("ADMIN", "LIDERANCA"),
  controller.listar
);

/* =====================================================
  PREVIEW → ADMIN + LIDERANCA
  (simulação sem salvar)
===================================================== */
router.post(
  "/preview",
  authorizeRoles("ADMIN", "LIDERANCA"),
  controller.preview
);

/* =====================================================
  GERAR → apenas ADMIN
===================================================== */
router.post(
  "/",
  authorizeRoles("ADMIN"),
  controller.gerar
);

/* =====================================================
  DELETE → apenas ADMIN
===================================================== */
router.delete(
  "/",
  authorizeRoles("ADMIN"),
  controller.deletar
);

module.exports = router;