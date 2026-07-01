// backend/routes/client/notificacionesRoutes.js
const express = require('express');
const router = express.Router();
const notificacionesController = require('../../controllers/client/notificacionesController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER TODAS LAS NOTIFICACIONES ──────────────────────────
router.get('/', verificarToken, notificacionesController.obtenerNotificaciones);

// ─── OBTENER CONTE O DE NO LEÍDAS ──────────────────────────────
router.get('/no-leidas', verificarToken, notificacionesController.obtenerNoLeidas);

// ─── MARCAR COMO LEÍDA ──────────────────────────────────────────
router.put('/:id/leer', verificarToken, notificacionesController.marcarComoLeida);

// ─── MARCAR TODAS COMO LEÍDAS ────────────────────────────────────
router.put('/leer-todas', verificarToken, notificacionesController.marcarTodasComoLeidas);

// ─── ELIMINAR NOTIFICACIÓN ──────────────────────────────────────
router.delete('/:id', verificarToken, notificacionesController.eliminarNotificacion);

module.exports = router;