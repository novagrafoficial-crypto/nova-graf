const db = require('../../config/db');

const obtenerTodos = async () => {
  const result = await db.query(`
    SELECT 
      d.id, d.nombre, d.tipo, d.valor, d.cantidad_minima,
      d.fecha_inicio, d.fecha_fin, d.activo,
      COUNT(dp.id) AS total_productos
    FROM marketing.descuentos d
    LEFT JOIN marketing.descuento_productos dp ON d.id = dp.descuento_id
    GROUP BY d.id
    ORDER BY d.id DESC
  `);
  return result.rows;
};

const obtenerPorId = async (id) => {
  const descuento = await db.query(
    `SELECT * FROM marketing.descuentos WHERE id = $1`, [id]
  );
  const productos = await db.query(`
    SELECT dp.id, dp.producto_id, dp.variante_id, dp.prioridad,
      p.nombre AS producto_nombre
    FROM marketing.descuento_productos dp
    LEFT JOIN productos.productos p ON dp.producto_id = p.id
    WHERE dp.descuento_id = $1
  `, [id]);
  return { descuento: descuento.rows[0], productos: productos.rows };
};

const crear = async (nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin) => {
  const result = await db.query(`
    INSERT INTO marketing.descuentos (nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin, activo)
    VALUES ($1, $2, $3, $4, $5, $6, false)
    RETURNING *
  `, [nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin]);
  return result.rows[0];
};

const actualizar = async (id, nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin) => {
  const result = await db.query(`
    UPDATE marketing.descuentos 
    SET nombre=$1, tipo=$2, valor=$3, cantidad_minima=$4, fecha_inicio=$5, fecha_fin=$6
    WHERE id=$7 RETURNING *
  `, [nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin, id]);
  return result.rows[0];
};

const toggleActivo = async (id, activo) => {
  const result = await db.query(
    `UPDATE marketing.descuentos SET activo=$1 WHERE id=$2 RETURNING *`,
    [activo, id]
  );
  return result.rows[0];
};

const eliminar = async (id) => {
  await db.query(`DELETE FROM marketing.descuento_productos WHERE descuento_id=$1`, [id]);
  await db.query(`DELETE FROM marketing.descuentos WHERE id=$1`, [id]);
};

const asignarProductos = async (descuento_id, productos) => {
  await db.query(`DELETE FROM marketing.descuento_productos WHERE descuento_id=$1`, [descuento_id]);
  for (const p of productos) {
    await db.query(`
      INSERT INTO marketing.descuento_productos (descuento_id, producto_id, prioridad)
      VALUES ($1, $2, $3)
    `, [descuento_id, p.producto_id, p.prioridad || 1]);
  }
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, toggleActivo, eliminar, asignarProductos };