const express = require("express");
const router = express.Router();

const treinamentoController = require("../controllers/treinamento.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

/* =====================================================
   TREINAMENTOS
===================================================== */

/**
 * CRIAR TREINAMENTO
 * POST /api/treinamentos
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "GESTAO", "LIDERANCA"),
  treinamentoController.createTreinamento
);

/**
 * LISTAR TREINAMENTOS
 * GET /api/treinamentos
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "GESTAO", "LIDERANCA"),
  treinamentoController.listTreinamentos
);

/**
 * GERAR URL DE UPLOAD DA ATA (PDF)
 * POST /api/treinamentos/:id/presign-ata
 */
router.post(
  "/:id/presign-ata",
  authenticate,
  authorize("ADMIN", "GESTAO", "LIDERANCA"),
  treinamentoController.presignUploadAta
);

/**
 * FINALIZAR TREINAMENTO
 * POST /api/treinamentos/:id/finalizar
 *
 * body:
 * {
 *   documentoKey,
 *   nome,
 *   mime,
 *   size
 * }
 */
router.post(
  "/:id/finalizar",
  authenticate,
  authorize("ADMIN", "GESTAO", "LIDERANCA"),
  treinamentoController.finalizarTreinamento
);

module.exports = router;
