const express = require("express");
const router = express.Router();

const {
  dashboardDesligamento,
  getDesligamentosDetalhado,
} = require("../controllers/desligamentoDashboard.controller");

// GET /api/dashboard/desligamento
router.get("/", dashboardDesligamento);

// GET /api/dashboard/desligamento/detalhado
router.get("/detalhado", getDesligamentosDetalhado);

module.exports = router;