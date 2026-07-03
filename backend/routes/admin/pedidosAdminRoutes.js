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

router.get('/notificaciones/:adminId', async (req, res) => {
  try {
    const result = await require('../../config/db').query(
      `SELECT * FROM ventas.notificaciones 
       WHERE usuario_id = $1 AND leida = false 
       ORDER BY creado_en DESC`,
      [req.params.adminId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notificaciones/:id/leer', async (req, res) => {
  try {
    await require('../../config/db').query(
      `UPDATE ventas.notificaciones SET leida = true, leida_en = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;