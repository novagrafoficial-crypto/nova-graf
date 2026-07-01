// backend/routes/client/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../../controllers/client/pedidoController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER DETALLE DE PEDIDO ────────────────────────────────────
router.get('/:id', verificarToken, pedidoController.obtenerDetallePedido);

// ─── SUBIR COMPROBANTE (SOLO JSON) ──────────────────────────────
router.post('/:id/comprobante', verificarToken, pedidoController.subirComprobante);

// ─── OBTENER TODOS LOS PEDIDOS DEL USUARIO ───────────────────────
router.get('/', verificarToken, pedidoController.obtenerPedidosUsuario);

// ─── SUBIR DISEÑO ─────────────────────────────────────────────────
router.post('/:id/diseno', verificarToken, pedidoController.subirDiseno); // ← NUEVO

// ─── OBTENER DISEÑOS DEL PEDIDO ──────────────────────────────────
router.get('/:id/disenos', verificarToken, pedidoController.obtenerDisenos); // ← NUEVO (opcional)

module.exports = router;