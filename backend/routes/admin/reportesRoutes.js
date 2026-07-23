const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// ── Ventas por mes ──────────────────────────────────────────────
router.get('/ventas-por-mes', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        TO_CHAR(fecha_pedido, 'YYYY-MM') AS mes,
        COUNT(*) AS total_pedidos,
        SUM(total_general) AS ingresos
      FROM ventas.pedidos_clientes
      WHERE estado != 'CANCELADO'
      GROUP BY mes
      ORDER BY mes ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Pedidos por estado ──────────────────────────────────────────
router.get('/pedidos-por-estado', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT estado, COUNT(*) AS total
      FROM ventas.pedidos_clientes
      GROUP BY estado
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Productos más vendidos ──────────────────────────────────────
router.get('/productos-mas-vendidos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.nombre,
        SUM(pcd.cantidad) AS unidades_vendidas,
        SUM(pcd.cantidad * pcd.precio_unitario) AS ingresos_total
      FROM ventas.pedido_cliente_detalle pcd
      JOIN productos.producto_variantes pv ON pcd.variante_id = pv.id
      JOIN productos.productos p ON pv.producto_id = p.id
      JOIN ventas.pedidos_clientes pc ON pcd.pedido_cliente_id = pc.id
      WHERE pc.estado != 'CANCELADO'
      GROUP BY p.nombre
      ORDER BY unidades_vendidas DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dataset C1 — Cancelación ────────────────────────────────────
router.get('/dataset-cancelacion', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (pc.id)
        u.id_usuario,
        DATE_PART('year', AGE(NOW(), u.fecha_nacimiento)) AS edad,
        AVG(pc2.total_general) OVER (PARTITION BY u.id_usuario) AS gasto_promedio,
        COUNT(pc2.id) OVER (PARTITION BY u.id_usuario) AS total_pedidos,
        SUM(CASE WHEN pc2.estado = 'CANCELADO' THEN 1 ELSE 0 END) OVER (PARTITION BY u.id_usuario) * 1.0 /
          NULLIF(COUNT(pc2.id) OVER (PARTITION BY u.id_usuario), 0) AS tasa_cancelacion,
        pc.total_general AS monto_pedido,
        p.categoria_id AS categoria,
        pc.metodo_pago_id AS metodo_pago,
        pc.metodo_entrega_id AS metodo_entrega,
        CASE WHEN COUNT(pc2.id) OVER (PARTITION BY u.id_usuario) < 2 THEN 1 ELSE 0 END AS es_nuevo,
        pcd.cantidad AS cantidad_productos,
        DATE_PART('day', pc.fecha_entrega_estimada - pc.fecha_pedido) AS dias_entrega,
        CASE WHEN pc.estado = 'CANCELADO' THEN 1 ELSE 0 END AS cancelado
      FROM ventas.pedidos_clientes pc
      JOIN ventas.pedidos_clientes pc2 ON pc2.usuario_id = pc.usuario_id
      JOIN public.usuarios u ON pc.usuario_id = u.id_usuario
      JOIN ventas.pedido_cliente_detalle pcd ON pcd.pedido_cliente_id = pc.id
      JOIN productos.producto_variantes pv ON pcd.variante_id = pv.id
      JOIN productos.productos p ON pv.producto_id = p.id
      WHERE pc.estado IN ('CANCELADO', 'ENVIADO')
        AND u.fecha_nacimiento IS NOT NULL
    `);

    // Convertir a CSV
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sin datos' });
    const cols = Object.keys(result.rows[0]);
    const csv = [cols.join(','), ...result.rows.map(r => cols.map(c => r[c]).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dataset_c1_cancelacion.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dataset K1 — Segmentación ───────────────────────────────────
router.get('/dataset-segmentacion', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id_usuario AS id_cliente,
        DATE_PART('year', AGE(NOW(), u.fecha_nacimiento)) AS edad,
        DATE_PART('month', AGE(NOW(), u.fecha_registro)) AS antiguedad_cliente,
        COUNT(DISTINCT pc.id) AS total_pedidos,
        COALESCE(SUM(pc.total_general), 0) AS gasto_total,
        COALESCE(SUM(CASE WHEN pc.estado = 'CANCELADO' THEN 1 ELSE 0 END) * 1.0 / 
          NULLIF(COUNT(pc.id), 0), 0) AS tasa_cancelacion,
        COUNT(DISTINCT p.categoria_id) AS categorias_distintas,
        COALESCE(DATE_PART('day', NOW() - MAX(pc.fecha_pedido)), 999) AS dias_desde_ultima_compra,
        COALESCE(AVG(pcd.cantidad), 0) AS productos_promedio_pedido,
        MODE() WITHIN GROUP (ORDER BY mp.nombre) AS metodo_pago_preferido,
        MODE() WITHIN GROUP (ORDER BY me.nombre) AS metodo_entrega_preferido
      FROM public.usuarios u
      LEFT JOIN ventas.pedidos_clientes pc ON pc.usuario_id = u.id_usuario
      LEFT JOIN ventas.pedido_cliente_detalle pcd ON pcd.pedido_cliente_id = pc.id
      LEFT JOIN productos.producto_variantes pv ON pcd.variante_id = pv.id
      LEFT JOIN productos.productos p ON pv.producto_id = p.id
      LEFT JOIN ventas.metodos_pago mp ON pc.metodo_pago_id = mp.id
      LEFT JOIN ventas.metodos_entrega me ON pc.metodo_entrega_id = me.id
      WHERE u.rol = 'cliente' AND u.fecha_nacimiento IS NOT NULL
      GROUP BY u.id_usuario, u.fecha_nacimiento, u.fecha_registro
    `);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Sin datos' });
    const cols = Object.keys(result.rows[0]);
    const csv = [cols.join(','), ...result.rows.map(r => cols.map(c => r[c]).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=dataset_k1_segmentacion.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;