const express = require("express");
const router = express.Router();
const {
  obterTurnoAtual,
  listarEsteiras,
  listarAlocacoes,
  listarAutoAlocacoes,
  listarFullD1,
  obterProducaoTurno,
  criarAlocacao,
  removerAlocacao,
  moverAlocacao,
  listarMovimentacoesPesca,
  criarAlocacaoFullD1,
  removerAlocacaoFullD1,
  diaristasDisponiveis,
  buscarElegiveis,
} = require("../controllers/mapaOperacional.controller");
const { listarEfetivo } = require("../controllers/efetivo.controller");
const { obterPainelExecutivo } = require("../controllers/painelExecutivo.controller");
const { adminAltaGestaoLideranca } = require("../utils/roles");
const onlyEstacao = require("../middlewares/onlyEstacao");

// Exclusivo estação 1 (Jaboatão) — ADMIN global passa direto
router.use(adminAltaGestaoLideranca, onlyEstacao([1]));

router.get("/turno-atual", obterTurnoAtual);
router.get("/esteiras", listarEsteiras);
router.get("/esteiras/:idEsteira/alocacoes", listarAlocacoes);
router.get("/esteiras/:idEsteira/auto-alocacoes", listarAutoAlocacoes);
router.get("/esteiras/:idEsteira/producao-turno", obterProducaoTurno);
router.post("/esteiras/:idEsteira/alocacoes", criarAlocacao);
router.delete("/esteiras/:idEsteira/alocacoes/:idAlocacao", removerAlocacao);
router.post("/esteiras/:idEsteira/alocacoes/:idAlocacao/mover", moverAlocacao);
router.get("/esteiras/:idEsteira/pesca/movimentacoes", listarMovimentacoesPesca);

router.get("/diaristas-disponiveis", diaristasDisponiveis);
router.get("/colaboradores-elegiveis", buscarElegiveis);
router.get("/efetivo", listarEfetivo);
router.get("/full-d1", listarFullD1);
router.post("/full-d1/alocacoes", criarAlocacaoFullD1);
router.delete("/full-d1/alocacoes/:idAlocacao", removerAlocacaoFullD1);
router.get("/painel-executivo", obterPainelExecutivo);

module.exports = router;
