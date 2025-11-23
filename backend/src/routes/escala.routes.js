const express = require('express');
const router = express.Router();
const controller = require('../controllers/escala.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllEscalas));
router.get('/:id', authenticate, asyncHandler(controller.getEscalaById));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createEscala));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateEscala));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteEscala));

module.exports = router;
