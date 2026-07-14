// backend/routes/client/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const pedidoController = require('../../controllers/client/pedidoController');
const metodosPagoController = require('../../controllers/client/metodosPagoController');
const metodosEntregaController = require('../../controllers/client/metodosEntregaController'); // ← NUEVO
const verificarToken = require('../../src/middlewares/auth');

// ─── MÉTODOS DE ENTREGA ────────────────────────────────────────────
router.get('/metodos-entrega', verificarToken, pedidoController.obtenerMetodosEntrega);

// ✅ NUEVAS RUTAS PARA AGRUPACIÓN DINÁMICA
router.get('/puntos-medios', verificarToken, metodosEntregaController.obtenerPuntosMedios);
router.get('/colonias', verificarToken, metodosEntregaController.obtenerColonias);
router.get('/tiendas-fisicas', verificarToken, metodosEntregaController.obtenerTiendasFisicas);

// ─── MÉTODOS DE PAGO ──────────────────────────────────────────────
router.get('/metodos-pago', verificarToken, metodosPagoController.obtenerMetodosPagoCliente);

// ─── CREAR PEDIDO ──────────────────────────────────────────────────
router.post('/crear-pedido', verificarToken, pedidoController.crearPedido);

module.exports = router;