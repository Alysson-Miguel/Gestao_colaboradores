/**
 * Rotas de Autenticação
 * /api/auth
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');

// Rotas públicas
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Rotas protegidas
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/me', authenticate, asyncHandler(authController.updateMe));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword));

module.exports = router;
