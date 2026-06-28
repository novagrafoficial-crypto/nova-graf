// routes/client/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../../controllers/client/pedidoController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER MÉTODOS DE ENTREGA ────────────────────────────────────
router.get('/metodos-entrega', verificarToken, pedidoController.obtenerMetodosEntrega);

// ─── CREAR PEDIDO ──────────────────────────────────────────────────
router.post('/crear-pedido', verificarToken, pedidoController.crearPedido);

module.exports = router;