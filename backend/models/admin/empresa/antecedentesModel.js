const db = require("../../../config/db");

const obtenerAntecedentes = async () => {
  const result = await db.query(`
    SELECT * FROM empresa.antecedentes ORDER BY fecha_evento DESC
  `);
  return result.rows;
};

const crearAntecedente = async (empresa_id, descripcion, fecha_evento) => {
  if (!descripcion?.trim()) throw new Error("La descripción es requerida");
  if (!fecha_evento) throw new Error("La fecha es requerida");
  const result = await db.query(
    `INSERT INTO empresa.antecedentes (empresa_id, descripcion, fecha_evento)
     VALUES ($1, $2, $3) RETURNING *`,
    [empresa_id, descripcion.trim(), fecha_evento]
  );
  return result.rows[0];
};

const actualizarAntecedente = async (id, descripcion, fecha_evento) => {
  if (!descripcion?.trim()) throw new Error("La descripción es requerida");
  if (!fecha_evento) throw new Error("La fecha es requerida");
  const result = await db.query(
    `UPDATE empresa.antecedentes SET descripcion = $1, fecha_evento = $2
     WHERE id = $3 RETURNING *`,
    [descripcion.trim(), fecha_evento, id]
  );
  if (result.rowCount === 0) throw new Error("Antecedente no encontrado");
  return result.rows[0];
};

const eliminarAntecedente = async (id) => {
  const result = await db.query(
    `DELETE FROM empresa.antecedentes WHERE id = $1 RETURNING *`, [id]
  );
  if (result.rowCount === 0) throw new Error("Antecedente no encontrado");
  return result.rows[0];
};

module.exports = { obtenerAntecedentes, crearAntecedente, actualizarAntecedente, eliminarAntecedente };