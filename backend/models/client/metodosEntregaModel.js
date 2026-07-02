// models/client/metodosEntregaModel.js
const pool = require('../../config/db');

const obtenerMetodosEntrega = async () => {
  const query = `
    SELECT 
      id,
      tipo,
      nombre,
      descripcion,
      costo,
      es_dinamico_km,
      costo_por_km,
      costo_minimo,
      activo
    FROM ventas.metodos_entrega
    WHERE activo = true
    ORDER BY costo ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

const obtenerMetodoEntregaById = async (id) => {
  const query = `
    SELECT 
      id,
      tipo,
      nombre,
      descripcion,
      costo,
      es_dinamico_km,
      costo_por_km,
      costo_minimo,
      activo
    FROM ventas.metodos_entrega
    WHERE id = $1 AND activo = true
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

module.exports = {
  obtenerMetodosEntrega,
  obtenerMetodoEntregaById
};