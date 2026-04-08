const pool = require('../../config/db');

const crearBorrador = async (usuarioId, productoId, varianteId, nombre, imagenPreview, elementos) => {
  const query = `
    INSERT INTO ventas.borradores_diseno 
      (usuario_id, producto_id, variante_id, nombre, imagen_preview, elementos)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [usuarioId, productoId, varianteId, nombre, imagenPreview, JSON.stringify(elementos)];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const obtenerBorradoresPorUsuario = async (usuarioId) => {
  const query = `
    SELECT 
      b.id, b.nombre, b.imagen_preview, b.fecha_creacion, b.fecha_modificacion,
      p.nombre AS producto_nombre,
      p.precio_base,                          -- <-- AÑADIDO
      pv.imagen_url AS variante_imagen,
      pv.precio_adicional,                    -- <-- AÑADIDO
      col.nombre AS variante_color,
      b.producto_id, b.variante_id,
      b.elementos
    FROM ventas.borradores_diseno b
    JOIN productos.productos p ON b.producto_id = p.id
    LEFT JOIN productos.producto_variantes pv ON b.variante_id = pv.id
    LEFT JOIN productos.colores col ON pv.color_id = col.id
    WHERE b.usuario_id = $1 AND b.activo = true
    ORDER BY b.fecha_modificacion DESC;
  `;
  const { rows } = await pool.query(query, [usuarioId]);
  return rows;
};

const obtenerBorradorPorId = async (borradorId, usuarioId) => {
  const query = `
    SELECT * FROM ventas.borradores_diseno
    WHERE id = $1 AND usuario_id = $2 AND activo = true;
  `;
  const { rows } = await pool.query(query, [borradorId, usuarioId]);
  return rows[0];
};

const actualizarBorrador = async (borradorId, usuarioId, nombre, imagenPreview, elementos) => {
  const query = `
    UPDATE ventas.borradores_diseno
    SET nombre = $1,
        imagen_preview = $2,
        elementos = $3,
        fecha_modificacion = CURRENT_TIMESTAMP
    WHERE id = $4 AND usuario_id = $5
    RETURNING *;
  `;
  const values = [nombre, imagenPreview, JSON.stringify(elementos), borradorId, usuarioId];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const eliminarBorrador = async (borradorId, usuarioId) => {
  const query = `
    UPDATE ventas.borradores_diseno SET activo = false
    WHERE id = $1 AND usuario_id = $2;
  `;
  await pool.query(query, [borradorId, usuarioId]);
  return true;
};

module.exports = {
  crearBorrador,
  obtenerBorradoresPorUsuario,
  obtenerBorradorPorId,
  actualizarBorrador,
  eliminarBorrador,
};