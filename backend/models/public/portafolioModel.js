const pool = require('../../config/db');

const getAllPortafolio = async () => {
  const query = `
    SELECT 
      po.id,
      po.descripcion,
      po.imagen_url,
      po.fecha_creacion,
      p.nombre AS producto_nombre,
      p.id AS producto_id
    FROM empresa.portafolio po
    LEFT JOIN productos.productos p ON po.producto_id = p.id
    WHERE po.publicado = true
    ORDER BY po.fecha_creacion DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = { getAllPortafolio };