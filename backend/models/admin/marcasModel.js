const client = require('../../config/db');

// Obtener todas
const obtenerTodas = async () => {
  const result = await client.query(
    'SELECT * FROM marcas ORDER BY id ASC'
  );
  return result.rows;
};

// Crear
const crear = async (nombre) => {
  const result = await client.query(
    'INSERT INTO marcas (nombre) VALUES ($1) RETURNING *',
    [nombre]
  );
  return result.rows[0];
};

// Actualizar
const actualizar = async (id, nombre) => {
  const result = await client.query(
    'UPDATE marcas SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre, id]
  );
  return result.rows[0];
};

// Eliminar
const eliminar = async (id) => {
  await client.query(
    'DELETE FROM marcas WHERE id = $1',
    [id]
  );
};

module.exports = {
  obtenerTodas,
  crear,
  actualizar,
  eliminar
};
