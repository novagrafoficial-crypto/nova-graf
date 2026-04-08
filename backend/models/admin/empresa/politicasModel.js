const db = require("../../../config/db");

const obtenerPoliticas = async () => {
  const result = await db.query(`SELECT * FROM empresa.politicas ORDER BY id`);
  return result.rows;
};

const crearPolitica = async (empresa_id, descripcion) => {
  if (!descripcion?.trim()) throw new Error("La descripción es requerida");
  const result = await db.query(
    `INSERT INTO empresa.politicas (empresa_id, descripcion) VALUES ($1, $2) RETURNING *`,
    [empresa_id, descripcion.trim()]
  );
  return result.rows[0];
};

const actualizarPolitica = async (id, descripcion) => {
  if (!descripcion?.trim()) throw new Error("La descripción es requerida");
  const result = await db.query(
    `UPDATE empresa.politicas SET descripcion = $1 WHERE id = $2 RETURNING *`,
    [descripcion.trim(), id]
  );
  if (result.rowCount === 0) throw new Error("Política no encontrada");
  return result.rows[0];
};

const eliminarPolitica = async (id) => {
  const result = await db.query(
    `DELETE FROM empresa.politicas WHERE id = $1 RETURNING *`, [id]
  );
  if (result.rowCount === 0) throw new Error("Política no encontrada");
  return result.rows[0];
};

module.exports = { obtenerPoliticas, crearPolitica, actualizarPolitica, eliminarPolitica };