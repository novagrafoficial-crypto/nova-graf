const db = require('../../config/db');

const obtenerTodos = async () => {
  const result = await db.query(`SELECT * FROM ventas.metodos_entrega ORDER BY id ASC`);
  return result.rows;
};

const crear = async ({ tipo, nombre, descripcion, costo, es_dinamico_km, costo_por_km, costo_minimo, activo }) => {
  const result = await db.query(`
    INSERT INTO ventas.metodos_entrega (tipo, nombre, descripcion, costo, es_dinamico_km, costo_por_km, costo_minimo, activo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `, [tipo, nombre, descripcion, costo ?? 0, es_dinamico_km ?? false, costo_por_km ?? 0, costo_minimo ?? 0, activo ?? true]);
  return result.rows[0];
};

const actualizar = async (id, { tipo, nombre, descripcion, costo, es_dinamico_km, costo_por_km, costo_minimo, activo }) => {
  const result = await db.query(`
    UPDATE ventas.metodos_entrega 
    SET tipo=$1, nombre=$2, descripcion=$3, costo=$4, es_dinamico_km=$5, costo_por_km=$6, costo_minimo=$7, activo=$8
    WHERE id=$9 RETURNING *
  `, [tipo, nombre, descripcion, costo, es_dinamico_km, costo_por_km, costo_minimo, activo, id]);
  return result.rows[0];
};

const toggleActivo = async (id, activo) => {
  const result = await db.query(
    `UPDATE ventas.metodos_entrega SET activo=$1 WHERE id=$2 RETURNING *`, [activo, id]
  );
  return result.rows[0];
};

module.exports = { obtenerTodos, crear, actualizar, toggleActivo };