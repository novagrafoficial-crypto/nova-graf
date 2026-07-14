// backend/routes/client/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/client/chatController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER MENSAJES ─────────────────────────────────────────────
router.get('/:id/chat', verificarToken, chatController.obtenerMensajes);

// ─── ENVIAR MENSAJE ──────────────────────────────────────────────
router.post('/:id/chat', verificarToken, chatController.enviarMensaje);

module.exports = router;