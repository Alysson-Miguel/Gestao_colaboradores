const express = require("express");
const router = express.Router();

const {
  registrarPontoCPF,
  getControlePresenca,
  ajusteManualPresenca,
} = require("../controllers/ponto.controller");

// colaborador
router.post("/registrar", registrarPontoCPF);

// gestão
router.get("/controle", getControlePresenca);
router.post("/ajuste-manual", ajusteManualPresenca);

module.exports = router;
