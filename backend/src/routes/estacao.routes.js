const express = require('express');
const router = express.Router();
const controller = require('../controllers/estacao.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllEstacoes));
router.get('/:id', authenticate, asyncHandler(controller.getEstacaoById));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createEstacao));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateEstacao));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteEstacao));

module.exports = router;
