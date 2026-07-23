// backend/routes/client/ofertaRoutes.js
const express = require('express');
const router = express.Router();
const ofertaController = require('../../controllers/client/ofertaController');
const verificarToken = require('../../src/middlewares/auth');

// ─── APLICAR AUTENTICACIÓN A TODAS LAS RUTAS ──────────────────
router.use(verificarToken);

// ─── RUTAS ESPECÍFICAS PRIMERO ──────────────────
// Obtener ofertas por producto (DEBE ir antes de /:id)
router.get('/producto/:productoId', ofertaController.getOfertasByProducto);

// ─── RUTAS CON PARÁMETROS DESPUÉS ──────────────────
// Obtener todas las ofertas
router.get('/', ofertaController.getOfertas);

// Obtener detalle de una oferta (DEBE ir al final)
router.get('/:id', ofertaController.getOfertaDetalle);

module.exports = router;