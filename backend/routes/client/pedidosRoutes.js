// backend/routes/client/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../../controllers/client/pedidoController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER DETALLE DE PEDIDO ────────────────────────────────────
router.get('/:id', verificarToken, pedidoController.obtenerDetallePedido);

// ─── SUBIR COMPROBANTE (SOLO JSON) ──────────────────────────────
router.post('/:id/comprobante', verificarToken, pedidoController.subirComprobante);

// ─── SUBIR DISEÑO (SOLO JSON) ────────────────────────────────────
router.post('/:id/diseno', verificarToken, pedidoController.subirDiseno);

// ─── CREAR PREVIA (SOLO JSON) ────────────────────────────────────
router.post('/:id/previa', verificarToken, pedidoController.crearPrevia);

module.exports = router;