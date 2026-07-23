const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const axios = require('axios');

const ML_API = 'https://nova-graf-ml-api-wvzu.onrender.com';

router.get('/:id/segmento', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        DATE_PART('year', AGE(NOW(), u.fecha_nacimiento)) AS edad,
        DATE_PART('month', AGE(NOW(), u.fecha_registro)) AS antiguedad_cliente,
        COUNT(DISTINCT pc.id) AS total_pedidos,
        COALESCE(SUM(pc.total_general), 0) AS gasto_total,
        COALESCE(
          SUM(CASE WHEN pc.estado = 'CANCELADO' THEN 1 ELSE 0 END) * 1.0 /
          NULLIF(COUNT(pc.id), 0), 0
        ) AS tasa_cancelacion,
        COUNT(DISTINCT p.categoria_id) AS categorias_distintas,
        COALESCE(DATE_PART('day', NOW() - MAX(pc.fecha_pedido)), 999) AS dias_desde_ultima_compra,
        COALESCE(AVG(pcd.cantidad), 0) AS productos_promedio_pedido
      FROM public.usuarios u
      LEFT JOIN ventas.pedidos_clientes pc ON pc.usuario_id = u.id_usuario
      LEFT JOIN ventas.pedido_cliente_detalle pcd ON pcd.pedido_cliente_id = pc.id
      LEFT JOIN productos.producto_variantes pv ON pcd.variante_id = pv.id
      LEFT JOIN productos.productos p ON pv.producto_id = p.id
      WHERE u.id_usuario = $1
      GROUP BY u.id_usuario, u.fecha_nacimiento, u.fecha_registro
    `, [id]);

    if (result.rows.length === 0 || !result.rows[0].edad) {
    return res.json({ cluster: 1, segmento: 'Ocasional' });
    }

    const datos = result.rows[0];
    console.log('Datos cluster:', datos);
    const prediccion = await axios.post(`${ML_API}/predecir-cluster`, datos);

    res.json(prediccion.data);
  } catch (err) {
    console.error('Error segmento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
