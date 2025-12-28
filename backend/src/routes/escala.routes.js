const express = require("express");
const router = express.Router();

const escalaController = require("../controllers/escala.controller");

// GET /escalas
router.get("/", escalaController.getEscalas);

module.exports = router;
