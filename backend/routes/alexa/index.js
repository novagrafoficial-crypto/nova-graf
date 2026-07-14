// backend/routes/alexa/index.js
const express = require('express');
const router = express.Router();
const verificarAlexa = require('../../src/middlewares/authAlexa');
const controller = require('../../controllers/alexa/pedidosController');

// ─── APLICAR MIDDLEWARE DE AUTENTICACIÓN ─────────────────
router.use(verificarAlexa);

// ─── RUTAS PARA ALEXA ─────────────────────────────────────

// 📋 Lista de pedidos
router.get('/pedidos', controller.obtenerPedidos);
router.get('/pedidos/estado/:estado', controller.obtenerPorEstado);
router.get('/pedidos/cliente/:nombre', controller.obtenerPorCliente);
router.get('/pedidos/fecha/:fecha', controller.obtenerPorFecha);

// 📄 Detalle completo
router.get('/pedidos/:id', controller.obtenerDetalleCompleto);

// 🔄 Actualizar estado
router.patch('/pedidos/:id/estado', controller.actualizarEstado);

// 📊 Estadísticas
router.get('/estadisticas', controller.obtenerEstadisticas);

// 📌 Últimos pendientes
router.get('/pendientes', controller.obtenerUltimosPendientes);

// 🏓 Ping
router.get('/ping', controller.ping);

module.exports = router;