const express = require('express');
const router = express.Router();
const controller = require('../controllers/tipoausencia.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllTiposAusencia));
router.get('/:id', authenticate, asyncHandler(controller.getTipoAusenciaById));
router.post('/', authenticate, authorize('ADMIN'), asyncHandler(controller.createTipoAusencia));
router.put('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.updateTipoAusencia));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteTipoAusencia));

module.exports = router;
