// routes/client/pedidosRoutes.js
const express = require('express');
const router = express.Router();
const { obtenerPedidos, cancelarPedido } = require('../../controllers/client/pedidosController');
const verificarToken = require('../../src/middlewares/auth'); // ← SIN DESTRUCTURING

router.get('/', verificarToken, obtenerPedidos);
router.put('/:id/cancelar', verificarToken, cancelarPedido);

module.exports = router;