const express = require("express");
const router = express.Router();

const {
  listarEstacoes,
  buscarEstacaoPorId,
  criarEstacao,
  atualizarEstacao,
} = require("../controllers/estacao.controller");

router.get("/", listarEstacoes);
router.get("/:idEstacao", buscarEstacaoPorId);
router.post("/", criarEstacao);
router.put("/:idEstacao", atualizarEstacao);

module.exports = router;
