const express = require("express");
const router = express.Router();
const c = require("../controllers/sinergiaInterna.controller");
const { adminAltaGestaoLideranca } = require("../utils/roles");
const onlyEstacao = require("../middlewares/onlyEstacao");
const { writeLimiter } = require("../middlewares/rateLimiter.middleware");

// Sinergia Interna é exclusiva da Label (estação 1) — ADMIN global passa direto.
// Quem pode agir em cada sinergia (líder do setor de origem/destino) é decidido no service.
router.use(adminAltaGestaoLideranca, onlyEstacao([1]));

router.get("/meta", c.metadados);
router.get("/colaboradores", c.buscarColaboradores);

// QR Code: o token é a única credencial; o backend decide quem pode confirmar.
router.post("/qr/consultar", writeLimiter, c.consultarQr);
router.post("/qr/confirmar", writeLimiter, c.confirmarQr);

router.get("/", c.listar);
router.post("/", writeLimiter, c.criar);

router.get("/lotes/:idLote/etiqueta", c.etiquetaGrupo);

router.get("/:id", c.detalhe);
router.get("/:id/etiqueta", c.etiqueta);
router.post("/:id/enviar", writeLimiter, c.enviar);
router.post("/:id/cancelar", writeLimiter, c.cancelar);
router.post("/:id/finalizar", writeLimiter, c.finalizar);
router.post("/:id/prorrogar", writeLimiter, c.prorrogar);
router.post("/:id/retorno-manual", writeLimiter, c.retornoManual);
router.post("/:id/reemitir-qr", writeLimiter, c.reemitirQr);

module.exports = router;
