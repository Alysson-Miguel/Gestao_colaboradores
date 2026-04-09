const express = require("express");
const router = express.Router();
const { authorize } = require("../middlewares/auth.middleware");
const { asyncHandler } = require("../middlewares/error.middleware");

const {
  listarEstacoes,
  buscarEstacaoPorId,
  criarEstacao,
  atualizarEstacao,
  excluirEstacao,
} = require("../controllers/estacao.controller");

router.get("/", asyncHandler(listarEstacoes));
router.get("/:idEstacao", asyncHandler(buscarEstacaoPorId));
router.post("/", authorize("ADMIN"), asyncHandler(criarEstacao));
router.put("/:idEstacao", authorize("ADMIN"), asyncHandler(atualizarEstacao));
router.delete("/:idEstacao", authorize("ADMIN"), asyncHandler(excluirEstacao));

module.exports = router;
