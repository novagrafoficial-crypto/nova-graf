// backend/routes/client/portafolioRoutes.js
const express = require('express');
const router = express.Router();
const portafolioController = require('../../controllers/client/portafolioController');

// ─── OBTENER TODOS LOS PRODUCTOS DEL PORTAFOLIO ──────────────────
router.get('/', portafolioController.obtenerPortafolio);

// ─── OBTENER DETALLE DE UN PRODUCTO DEL PORTAFOLIO ──────────────
router.get('/:id', portafolioController.obtenerPortafolioPorId);

// ─── OBTENER PORTAFOLIO POR PRODUCTO ──────────────────────────────
router.get('/producto/:productoId', portafolioController.obtenerPortafolioPorProducto);

module.exports = router;