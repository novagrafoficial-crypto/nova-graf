const db = require('../../config/db');

const obtenerTodos = async () => {
  const result = await db.query(
    `SELECT * FROM ventas.metodos_pago ORDER BY orden ASC`
  );
  return result.rows;
};

const obtenerPorId = async (id) => {
  const result = await db.query(
    `SELECT * FROM ventas.metodos_pago WHERE id = $1`, [id]
  );
  return result.rows[0];
};

const actualizar = async (id, { nombre, descripcion, instrucciones, datos_bancarios, requiere_comprobante, activo, orden }) => {
  const result = await db.query(`
    UPDATE ventas.metodos_pago 
    SET nombre=$1, descripcion=$2, instrucciones=$3, datos_bancarios=$4,
        requiere_comprobante=$5, activo=$6, orden=$7, updated_at=NOW()
    WHERE id=$8 RETURNING *
  `, [nombre, descripcion, instrucciones, JSON.stringify(datos_bancarios), requiere_comprobante, activo, orden, id]);
  return result.rows[0];
};

const toggleActivo = async (id, activo) => {
  const result = await db.query(
    `UPDATE ventas.metodos_pago SET activo=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [activo, id]
  );
  return result.rows[0];
};

const crear = async ({ nombre, tipo, descripcion, instrucciones, datos_bancarios, requiere_comprobante, activo, orden }) => {
  const result = await db.query(`
    INSERT INTO ventas.metodos_pago (nombre, tipo, descripcion, instrucciones, datos_bancarios, requiere_comprobante, activo, orden)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
  `, [nombre, tipo, descripcion, instrucciones, JSON.stringify(datos_bancarios), requiere_comprobante ?? true, activo ?? true, orden ?? 1]);
  return result.rows[0];
};

module.exports = { obtenerTodos, obtenerPorId, actualizar, toggleActivo, crear };

