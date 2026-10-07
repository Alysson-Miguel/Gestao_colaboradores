const express = require("express");
const router = express.Router();
const {
  listarTimes,
  criarTime,
  atualizarTime,
  excluirTime,
  adicionarIntegrante,
  atualizarIntegrante,
  removerIntegrante,
} = require("../controllers/times.controller");
const { adminAltaGestaoLideranca } = require("../utils/roles");
const onlyEstacao = require("../middlewares/onlyEstacao");

// Exclusivo estação 1 (Jaboatão) — mesma restrição do Mapa Operacional
router.use(adminAltaGestaoLideranca, onlyEstacao([1]));

router.get("/", listarTimes);
router.post("/", criarTime);
router.patch("/:idTime", atualizarTime);
router.delete("/:idTime", excluirTime);
router.post("/:idTime/integrantes", adicionarIntegrante);
router.patch("/:idTime/integrantes/:opsId", atualizarIntegrante);
router.delete("/:idTime/integrantes/:opsId", removerIntegrante);

module.exports = router;
