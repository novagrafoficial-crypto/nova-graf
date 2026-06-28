// routes/client/carritoRoutes.js
const express = require('express');
const router = express.Router();
const carritoController = require('../../controllers/client/carritoController');
const verificarToken = require('../../src/middlewares/auth');

// ─── OBTENER CARRITO ────────────────────────────────────────────────
router.get('/', verificarToken, carritoController.obtenerCarrito);

// ─── OBTENER CONTE O ────────────────────────────────────────────────
router.get('/count', verificarToken, carritoController.obtenerConteoCarrito);

// ─── OBTENER TOTAL ──────────────────────────────────────────────────
router.get('/total', verificarToken, carritoController.obtenerTotalCarrito);

// ─── AGREGAR AL CARRITO ─────────────────────────────────────────────
router.post('/', verificarToken, carritoController.agregarAlCarrito);

// ─── ACTUALIZAR CANTIDAD ────────────────────────────────────────────
router.put('/:id', verificarToken, carritoController.actualizarCantidad);

// ─── ELIMINAR DEL CARRITO ──────────────────────────────────────────
router.delete('/:id', verificarToken, carritoController.eliminarDelCarrito);

// ─── VACIAR CARRITO ─────────────────────────────────────────────────
router.delete('/', verificarToken, carritoController.vaciarCarrito);

module.exports = router;