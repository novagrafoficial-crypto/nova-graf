const db = require('../../config/db');

const obtenerTodas = async () => {
  const result = await db.query(`
    SELECT 
      c.id, c.fecha_compra, c.total_compra, c.observaciones,
      p.nombre_proveedor
    FROM inventario.compras c
    LEFT JOIN inventario.proveedores p ON c.proveedor_id = p.proveedor_id
    ORDER BY c.fecha_compra DESC
  `);
  return result.rows;
};

const obtenerPorId = async (id) => {
  const compra = await db.query(`
    SELECT c.*, p.nombre_proveedor
    FROM inventario.compras c
    LEFT JOIN inventario.proveedores p ON c.proveedor_id = p.proveedor_id
    WHERE c.id = $1
  `, [id]);

  const detalle = await db.query(`
    SELECT cd.*, pv.sku, pr.nombre AS producto_nombre
    FROM inventario.compras_detalle cd
    JOIN productos.producto_variantes pv ON cd.variante_id = pv.id
    JOIN productos.productos pr ON pv.producto_id = pr.id
    WHERE cd.compra_id = $1
  `, [id]);

  return { compra: compra.rows[0], detalle: detalle.rows };
};

const crear = async (proveedor_id, observaciones, detalle) => {
  const total = detalle.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0);

  const compra = await db.query(`
    INSERT INTO inventario.compras (proveedor_id, total_compra, observaciones)
    VALUES ($1, $2, $3) RETURNING *
  `, [proveedor_id, total, observaciones]);

  const compra_id = compra.rows[0].id;

  for (const d of detalle) {
    await db.query(`
      INSERT INTO inventario.compras_detalle (compra_id, variante_id, cantidad, precio_unitario, total)
      VALUES ($1, $2, $3, $4, $5)
    `, [compra_id, d.variante_id, d.cantidad, d.precio_unitario, d.cantidad * d.precio_unitario]);

    await db.query(`
      UPDATE inventario.inventario 
      SET cantidad = cantidad + $1, fecha_actualizacion = NOW()
      WHERE variante_id = $2
    `, [d.cantidad, d.variante_id]);
  }

  return compra.rows[0];
};

const eliminar = async (id) => {
  await db.query(`DELETE FROM inventario.compras_detalle WHERE compra_id = $1`, [id]);
  await db.query(`DELETE FROM inventario.compras WHERE id = $1`, [id]);
};

module.exports = { obtenerTodas, obtenerPorId, crear, eliminar };