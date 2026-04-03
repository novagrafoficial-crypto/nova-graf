const client = require("../../../config/db");

// Obtener todas
const obtenerVisiones = async () => {
  const result = await client.query(`
    SELECT *
    FROM empresa.vision
    ORDER BY id
  `);

  return result.rows;
};

// Crear
const crearVision = async (empresa_id, descripcion) => {
  const result = await client.query(
    `INSERT INTO empresa.vision (empresa_id, descripcion)
     VALUES ($1, $2)
     RETURNING *`,
    [empresa_id, descripcion]
  );

  return result.rows[0];
};

// Actualizar
const actualizarVision = async (id, descripcion) => {
  const result = await client.query(
    `UPDATE empresa.vision
     SET descripcion = $1
     WHERE id = $2
     RETURNING *`,
    [descripcion, id]
  );

  return result.rows[0];
};

// Eliminar
const eliminarVision = async (id) => {
  await client.query(
    `DELETE FROM empresa.vision
     WHERE id = $1`,
    [id]
  );

  return { mensaje: "Visión eliminada correctamente" };
};

module.exports = {
  obtenerVisiones,
  crearVision,
  actualizarVision,
  eliminarVision
};