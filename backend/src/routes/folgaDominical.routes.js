const express = require("express");
const router = express.Router();

const controller = require("../controllers/folgaDominical.controller");
const { authorizeRoles } = require("../middlewares/authorizeRoles");

// 👀 Visualizar → ADMIN e LIDERANCA
router.get(
  "/",
  authorizeRoles("ADMIN", "LIDERANCA"),
  controller.listar
);

// 🛠 Gerar → apenas ADMIN
router.post(
  "/",
  authorizeRoles("ADMIN"),
  controller.gerar
);

// 🗑 Deletar → apenas ADMIN
router.delete(
  "/",
  authorizeRoles("ADMIN"),
  controller.deletar
);

module.exports = router;