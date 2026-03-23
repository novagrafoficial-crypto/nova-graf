const client = require("../../../config/db");

// Obtener todas las misiones
const obtenerMisiones = async () => {
  const result = await client.query(`
    SELECT * 
    FROM empresa.mision
    ORDER BY id
  `);
  return result.rows;
};

// Crear misión
const crearMision = async (empresa_id, descripcion) => {
  const result = await client.query(
    `INSERT INTO empresa.mision (empresa_id, descripcion)
     VALUES ($1, $2)
     RETURNING *`,
    [empresa_id, descripcion]
  );

  return result.rows[0];
};

// Actualizar misión
const actualizarMision = async (id, descripcion) => {
  const result = await client.query(
    `UPDATE empresa.mision
     SET descripcion = $1
     WHERE id = $2
     RETURNING *`,
    [descripcion, id]
  );

  return result.rows[0];
};

// Eliminar misión
const eliminarMision = async (id) => {
  await client.query(
    `DELETE FROM empresa.mision
     WHERE id = $1`,
    [id]
  );

  return { mensaje: "Misión eliminada correctamente" };
};

module.exports = {
  obtenerMisiones,
  crearMision,
  actualizarMision,
  eliminarMision
};