const express = require('express');
const router = express.Router();
const controller = require('../controllers/cargo.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllCargos));
router.get('/:id', authenticate, asyncHandler(controller.getCargoById));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createCargo));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateCargo));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteCargo));

module.exports = router;
