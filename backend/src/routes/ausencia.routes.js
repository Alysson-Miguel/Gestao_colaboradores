const express = require('express');
const router = express.Router();
const controller = require('../controllers/ausencia.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllAusencias));
router.get('/ativas', authenticate, asyncHandler(controller.getAusenciasAtivas));
router.get('/:id', authenticate, asyncHandler(controller.getAusenciaById));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createAusencia));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateAusencia));
router.put('/:id/finalizar', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.finalizarAusencia));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteAusencia));

module.exports = router;
