const db = require("../../../config/db");

const obtenerValores = async () => {
  const result = await db.query(`SELECT * FROM empresa.valores ORDER BY id`);
  return result.rows;
};

const crearValor = async (empresa_id, valor, descripcion) => {
  if (!valor?.trim()) throw new Error("El valor es requerido");
  if (!descripcion?.trim()) throw new Error("La descripción es requerida");

  const result = await db.query(
    `INSERT INTO empresa.valores (empresa_id, valor, descripcion)
     VALUES ($1, $2, $3) RETURNING *`,
    [empresa_id, valor.trim(), descripcion.trim()]
  );
  return result.rows[0];
};

const actualizarValor = async (id, valor, descripcion) => {
  if (!valor?.trim()) throw new Error("El valor es requerido");
  if (!descripcion?.trim()) throw new Error("La descripción es requerida");

  const result = await db.query(
    `UPDATE empresa.valores SET valor = $1, descripcion = $2
     WHERE id = $3 RETURNING *`,
    [valor.trim(), descripcion.trim(), id]
  );
  if (result.rowCount === 0) throw new Error("Valor no encontrado");
  return result.rows[0];
};

const eliminarValor = async (id) => {
  const result = await db.query(
    `DELETE FROM empresa.valores WHERE id = $1 RETURNING *`, [id]
  );
  if (result.rowCount === 0) throw new Error("Valor no encontrado");
  return result.rows[0];
};

module.exports = { obtenerValores, crearValor, actualizarValor, eliminarValor };