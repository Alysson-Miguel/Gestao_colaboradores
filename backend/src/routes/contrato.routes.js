const express = require('express');
const router = express.Router();
const controller = require('../controllers/contrato.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllContratos));
router.get('/:id', authenticate, asyncHandler(controller.getContratoById));
router.post('/', authenticate, authorize('ADMIN'), asyncHandler(controller.createContrato));
router.put('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.updateContrato));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteContrato));

module.exports = router;
