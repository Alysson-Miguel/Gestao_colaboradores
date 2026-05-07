const express = require("express");
const router = express.Router();
const { getEsteirasPlanejadas } = require("../controllers/esteiras.controller");

router.get("/planejado", getEsteirasPlanejadas);

module.exports = router;
