// backend/routes/client/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../../controllers/client/pedidoController');
const metodosPagoController = require('../../controllers/client/metodosPagoController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER MÉTODOS DE ENTREGA ────────────────────────────────────
router.get('/metodos-entrega', verificarToken, pedidoController.obtenerMetodosEntrega);

// ─── OBTENER MÉTODOS DE PAGO ──────────────────────────────────────
router.get('/metodos-pago', verificarToken, metodosPagoController.obtenerMetodosPagoCliente);

// ─── CREAR PEDIDO ──────────────────────────────────────────────────
router.post('/crear-pedido', verificarToken, pedidoController.crearPedido);

module.exports = router;