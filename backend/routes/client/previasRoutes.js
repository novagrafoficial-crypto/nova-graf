// backend/routes/client/previasRoutes.js
const express = require('express');
const router = express.Router();
const previasController = require('../../controllers/client/previasController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER PREVIAS ──────────────────────────────────────────────
router.get('/:pedidoId', verificarToken, previasController.obtenerPrevias);

// ─── APROBAR PREVIA ───────────────────────────────────────────────
router.post('/:pedidoId/aprobar', verificarToken, previasController.aprobarPrevia);

// ─── RECHAZAR PREVIA ──────────────────────────────────────────────
router.post('/:pedidoId/rechazar', verificarToken, previasController.rechazarPrevia);

module.exports = router;