const express = require('express');
const router = express.Router();
const controller = require('../controllers/frequencia.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { injectDbContext } = require('../middlewares/dbContext.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, injectDbContext, asyncHandler(controller.getAllFrequencias));
router.get('/:id', authenticate, injectDbContext, asyncHandler(controller.getFrequenciaById));
router.post('/', authenticate, injectDbContext, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createFrequencia));
router.put('/:id', authenticate, injectDbContext, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateFrequencia));
router.put('/:id/validar', authenticate, injectDbContext, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.validarFrequencia));
router.delete('/:id', authenticate, injectDbContext, authorize('ADMIN'), asyncHandler(controller.deleteFrequencia));

module.exports = router;
