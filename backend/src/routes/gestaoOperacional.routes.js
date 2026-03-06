const express = require("express");
const router = express.Router();
const { carregarGestaoOperacional } = require("../controllers/gestaoOperacional.controller");
const { buscarMetasProducao, limparCache } = require("../services/googleSheetsMetaProducao.service");

router.get("/", carregarGestaoOperacional);

// Endpoint de teste
router.get("/test", async (req, res) => {
  try {
    const { turno = "T1", data = "2026-03-04" } = req.query;
    const result = await buscarMetasProducao(turno, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

// Endpoint para limpar cache
router.post("/limpar-cache", (req, res) => {
  limparCache();
  res.json({ success: true, message: "Cache limpo com sucesso" });
});
