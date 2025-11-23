const express = require('express');
const router = express.Router();
const controller = require('../controllers/setor.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', authenticate, asyncHandler(controller.getAllSetores));
router.get('/:id', authenticate, asyncHandler(controller.getSetorById));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.createSetor));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), asyncHandler(controller.updateSetor));
router.delete('/:id', authenticate, authorize('ADMIN'), asyncHandler(controller.deleteSetor));

module.exports = router;
