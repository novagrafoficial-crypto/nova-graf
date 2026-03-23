const db = require('../../config/db');

const obtenerTodas = async () => {
  const result = await db.query('SELECT * FROM productos.categorias ORDER BY id DESC');
  return result.rows;
};

const crear = async (nombre) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'INSERT INTO productos.categorias (nombre) VALUES ($1) RETURNING *',
    [nombre.trim()]
  );
  return result.rows[0];
};

const actualizar = async (id, nombre) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'UPDATE productos.categorias SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre.trim(), id]
  );
  if (result.rowCount === 0) throw new Error('Categoría no encontrada');
  return result.rows[0];
};

const eliminar = async (id) => {
  const result = await db.query(
    'DELETE FROM productos.categorias WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) throw new Error('Categoría no encontrada');
  return result.rows[0];
};

module.exports = { obtenerTodas, crear, actualizar, eliminar };