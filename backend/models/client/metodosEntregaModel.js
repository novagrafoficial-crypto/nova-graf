// backend/models/client/metodosEntregaModel.js
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
    ORDER BY 
      CASE tipo 
        WHEN 'RECOGIDA_FISICA' THEN 1 
        WHEN 'PUNTO_MEDIO' THEN 2 
        WHEN 'ENVIO_LOCAL' THEN 3 
        ELSE 4 
      END,
      costo ASC,
      nombre ASC
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

// ✅ CORREGIDO: AGREGAR campo tipo
const obtenerPuntosMedios = async () => {
  const query = `
    SELECT 
      id,
      tipo,
      nombre,
      descripcion,
      costo
    FROM ventas.metodos_entrega
    WHERE (tipo = 'PUNTO_MEDIO' OR (tipo = 'RECOGIDA_FISICA' AND nombre ILIKE '%punto medio%'))
      AND activo = true
    ORDER BY costo ASC, nombre ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// ✅ CORREGIDO: AGREGAR campo tipo
const obtenerColonias = async () => {
  const query = `
    SELECT 
      id,
      tipo,
      nombre,
      descripcion,
      costo
    FROM ventas.metodos_entrega
    WHERE tipo = 'ENVIO_LOCAL' AND activo = true
    ORDER BY costo ASC, nombre ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// ✅ CORREGIDO: AGREGAR campo tipo
const obtenerTiendasFisicas = async () => {
  const query = `
    SELECT 
      id,
      tipo,
      nombre,
      descripcion,
      costo
    FROM ventas.metodos_entrega
    WHERE tipo = 'RECOGIDA_FISICA' 
      AND NOT (nombre ILIKE '%punto medio%')
      AND activo = true
    ORDER BY costo ASC, nombre ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  obtenerMetodosEntrega,
  obtenerMetodoEntregaById,
  obtenerPuntosMedios,
  obtenerColonias,
  obtenerTiendasFisicas
};