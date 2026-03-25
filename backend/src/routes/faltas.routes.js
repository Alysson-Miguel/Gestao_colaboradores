const express = require("express");
const router = express.Router();

const {
  getResumoFaltas,
  getDistribuicoesFaltas,
  getTendenciaFaltas,
  getColaboradoresFaltas,
} = require("../controllers/faltas.controller");

/* ===============================
   DASHBOARD • FALTAS
================================ */

router.get("/resumo", getResumoFaltas);
router.get("/distribuicoes", getDistribuicoesFaltas);
router.get("/tendencia", getTendenciaFaltas);
router.get("/colaboradores", getColaboradoresFaltas)

module.exports = router;