const express = require("express");
const router = express.Router();

const controller = require("../controllers/atestado.controller");

// ================= PRESIGNED URL =================
router.post("/presign-upload", controller.presignUpload);
router.get("/:id/presign-download", controller.presignDownload);

// ================= CRUD =================
router.post("/", controller.createAtestado);
router.get("/", controller.getAllAtestados);
router.get("/:id", controller.getAtestadoById);
router.put("/:id", controller.updateAtestado);

// ================= STATUS =================
router.patch("/:id/finalizar", controller.finalizarAtestado);
router.patch("/:id/cancelar", controller.cancelarAtestado);

module.exports = router;
