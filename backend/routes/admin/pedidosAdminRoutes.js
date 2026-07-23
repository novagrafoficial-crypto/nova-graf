const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const {
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstado,
  actualizarPago,
  subirPrevia,
  enviarMensaje,
} = require('../../controllers/admin/pedidosController');

const { predecirCancelacion } = require('../../utils/mlPredictor');

router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.patch('/:id/estado', actualizarEstado);
router.patch('/pagos/:id', actualizarPago);
router.post('/previas', subirPrevia);
router.post('/chat', enviarMensaje);

router.get('/notificaciones/:adminId', async (req, res) => {
  try {
    const result = await db.query(
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
    await db.query(
      `UPDATE ventas.notificaciones SET leida = true, leida_en = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/riesgo-cancelacion', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        DATE_PART('year', AGE(NOW(), u.fecha_nacimiento)) AS edad,
        COUNT(pc2.id) OVER (PARTITION BY u.id_usuario) AS total_pedidos,
        SUM(CASE WHEN pc2.estado = 'CANCELADO' THEN 1 ELSE 0 END) OVER (PARTITION BY u.id_usuario) * 1.0 /
          NULLIF(COUNT(pc2.id) OVER (PARTITION BY u.id_usuario), 0) AS tasa_cancelacion,
        pc.metodo_pago_id AS metodo_pago,
        pc.metodo_entrega_id AS metodo_entrega,
        CASE WHEN COUNT(pc2.id) OVER (PARTITION BY u.id_usuario) < 2 THEN 1 ELSE 0 END AS es_nuevo,
        COALESCE(pcd.cantidad, 1) AS cantidad_productos,
        DATE_PART('day', pc.fecha_entrega_estimada - pc.fecha_pedido) AS dias_entrega
      FROM ventas.pedidos_clientes pc
      JOIN ventas.pedidos_clientes pc2 ON pc2.usuario_id = pc.usuario_id
      JOIN public.usuarios u ON pc.usuario_id = u.id_usuario
      LEFT JOIN ventas.pedido_cliente_detalle pcd ON pcd.pedido_cliente_id = pc.id
      WHERE pc.id = $1
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const datos = result.rows[0];
    console.log('Datos enviados al modelo:', datos);
    const prediccion = await predecirCancelacion(datos);

    res.json(prediccion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;