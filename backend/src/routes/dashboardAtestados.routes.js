const express = require("express");
const router = express.Router();

const {
  getResumoAtestados,
  getDistribuicoesAtestados,
  getTendenciaAtestados,
  getRiscoAtestados,
} = require("../controllers/dashboardAtestados.controller");

/* ===============================
   DASHBOARD • ATESTADOS
================================ */

router.get("/resumo", getResumoAtestados);
router.get("/distribuicoes", getDistribuicoesAtestados);
router.get("/tendencia", getTendenciaAtestados);
router.get("/risco", getRiscoAtestados);

module.exports = router;
