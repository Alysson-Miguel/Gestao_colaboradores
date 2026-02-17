const express = require('express');
const router = express.Router();
const { getOPA } = require('../controllers/opa.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * Rotas do OPA (Observação Preventiva de Atos)
 * Base: /api/opa
 */

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/opa - Buscar dados com filtros
router.get('/', getOPA);

module.exports = router;
