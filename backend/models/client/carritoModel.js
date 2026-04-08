const pool = require('../../config/db');

const agregarAlCarrito = async (usuarioId, productoPersonalizadoId, cantidad, precioUnitario) => {
  const query = `
    INSERT INTO ventas.carrito_compras (usuario_id, producto_personalizado_id, cantidad, precio_unitario)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [usuarioId, productoPersonalizadoId, cantidad, precioUnitario];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const obtenerCarrito = async (usuarioId) => {
  const query = `
    SELECT 
      c.id AS carrito_id,
      c.cantidad,
      c.precio_unitario,
      c.precio_total,
      pp.id AS personalizado_id,
      pp.imagen_personalizada_url,
      pp.texto_personalizado,
      p.nombre AS producto_nombre,
      pv.color,
      pv.imagen_url AS variante_imagen
    FROM ventas.carrito_compras c
    JOIN productos.productos_personalizados pp ON c.producto_personalizado_id = pp.id
    JOIN productos.producto_variantes pv ON pp.variante_id = pv.id
    JOIN productos.productos p ON pv.producto_id = p.id
    WHERE c.usuario_id = $1
    ORDER BY c.fecha_agregado DESC;
  `;
  const { rows } = await pool.query(query, [usuarioId]);
  return rows;
};

const obtenerConteoCarrito = async (usuarioId) => {
  const query = `SELECT COUNT(*) AS count FROM ventas.carrito_compras WHERE usuario_id = $1;`;
  const { rows } = await pool.query(query, [usuarioId]);
  return parseInt(rows[0].count) || 0;
};

const actualizarCantidad = async (carritoId, usuarioId, cantidad) => {
  const query = `
    UPDATE ventas.carrito_compras
    SET cantidad = $1
    WHERE id = $2 AND usuario_id = $3
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [cantidad, carritoId, usuarioId]);
  return rows[0];
};

const eliminarDelCarrito = async (carritoId, usuarioId) => {
  const query = `DELETE FROM ventas.carrito_compras WHERE id = $1 AND usuario_id = $2 RETURNING *;`;
  const { rows } = await pool.query(query, [carritoId, usuarioId]);
  return rows[0];
};

const obtenerItemCarritoPorProducto = async (usuarioId, productoPersonalizadoId) => {
  const query = `
    SELECT * FROM ventas.carrito_compras
    WHERE usuario_id = $1 AND producto_personalizado_id = $2
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [usuarioId, productoPersonalizadoId]);
  return rows[0] || null;
};

module.exports = {
  agregarAlCarrito,
  obtenerCarrito,
  obtenerConteoCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerItemCarritoPorProducto,
};