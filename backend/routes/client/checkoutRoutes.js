const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/client/checkoutController');
const verificarToken = require('../../src/middlewares/auth');

// Solo necesitamos el endpoint para procesar el checkout
router.post('/procesar', verificarToken, checkoutController.procesarCheckout);

module.exports = router;