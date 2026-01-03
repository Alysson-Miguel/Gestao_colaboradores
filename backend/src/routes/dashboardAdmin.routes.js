const express = require("express");
const router = express.Router();

/* =====================================================
   CONTROLLER
===================================================== */
const {
  carregarDashboardAdmin,
} = require("../controllers/dashboardAdmin.controller");
router.get("/", carregarDashboardAdmin);

module.exports = router;
