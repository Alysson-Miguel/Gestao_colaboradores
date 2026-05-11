const express = require("express");
const router = express.Router();
const { carregarProcessamentoGeral, carregarProcessamentoDiaCompleto } = require("../controllers/processamentoGeral.controller");
const { adminAltaGestaoLideranca } = require("../utils/roles");
const onlyEstacao = require("../middlewares/onlyEstacao");

// Exclusivo estação 1 — ADMIN global passa direto
router.use(adminAltaGestaoLideranca, onlyEstacao([1]));

router.get("/completo", carregarProcessamentoDiaCompleto);
router.get("/", carregarProcessamentoGeral);

module.exports = router;
