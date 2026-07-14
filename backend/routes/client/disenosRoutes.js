// backend/routes/client/disenosRoutes.js
const express = require('express');
const router = express.Router();
const disenosController = require('../../controllers/client/disenosController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER TODOS LOS DISEÑOS DEL CLIENTE ──────────────────────
router.get('/', verificarToken, disenosController.obtenerDisenosCliente);

// ─── OBTENER DETALLE DE UN DISEÑO ────────────────────────────────
router.get('/:id', verificarToken, disenosController.obtenerDisenoDetalle);

module.exports = router;