const express = require('express');
const router = express.Router();
const controller = require('../controllers/frequencia.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllFrequencias));
router.get('/:id', authenticate, asyncHandler(controller.getFrequenciaById));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createFrequencia));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateFrequencia));
router.put('/:id/validar', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.validarFrequencia));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteFrequencia));

module.exports = router;
