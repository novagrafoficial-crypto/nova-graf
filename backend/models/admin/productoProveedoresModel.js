const db = require('../../config/db');

const obtenerPorProducto = async (producto_id) => {
  const result = await db.query(
    `SELECT pp.id, pp.producto_id, pp.proveedor_id, pp.precio_costo, pp.fecha_registro,
            p.nombre_proveedor, p.contacto_nombre, p.telefono, p.correo_electronico
     FROM inventario.producto_proveedores pp
     JOIN inventario.proveedores p ON p.proveedor_id = pp.proveedor_id
     WHERE pp.producto_id = $1
     ORDER BY pp.fecha_registro DESC`,
    [producto_id]
  );
  return result.rows;
};

const agregar = async (producto_id, proveedor_id, precio_costo) => {
  const result = await db.query(
    `INSERT INTO inventario.producto_proveedores (producto_id, proveedor_id, precio_costo)
     VALUES ($1, $2, $3) RETURNING *`,
    [producto_id, proveedor_id, precio_costo || null]
  );
  return result.rows[0];
};

const actualizar = async (id, precio_costo) => {
  const result = await db.query(
    `UPDATE inventario.producto_proveedores
     SET precio_costo = $1
     WHERE id = $2 RETURNING *`,
    [precio_costo || null, id]
  );
  if (result.rowCount === 0) throw new Error('Relación no encontrada');
  return result.rows[0];
};

const eliminar = async (id) => {
  const result = await db.query(
    `DELETE FROM inventario.producto_proveedores WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rowCount === 0) throw new Error('Relación no encontrada');
  return result.rows[0];
};

module.exports = { obtenerPorProducto, agregar, actualizar, eliminar };