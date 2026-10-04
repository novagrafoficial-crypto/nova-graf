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

module.exports = router;