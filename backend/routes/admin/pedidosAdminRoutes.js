const express = require('express');
const router = express.Router();
const {
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstado,
  actualizarPago,
  subirPrevia,
  enviarMensaje,
} = require('../../controllers/admin/pedidosController');

router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.patch('/:id/estado', actualizarEstado);
router.patch('/pagos/:id', actualizarPago);
router.post('/previas', subirPrevia);
router.post('/chat', enviarMensaje);

module.exports = router;