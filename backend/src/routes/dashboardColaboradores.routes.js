const express = require("express");
const router = express.Router();

const {
  carregarDashboardColaboradores,
} = require("../controllers/dashboardColaboradores.controller");

// GET /dashboard/colaboradores?data=YYYY-MM-DD&turno=T1&setorId=...
router.get("/", carregarDashboardColaboradores);

module.exports = router;
