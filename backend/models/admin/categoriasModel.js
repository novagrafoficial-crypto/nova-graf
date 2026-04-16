// backend/models/admin/categoriasModel.js
const db = require('../../config/db');

const obtenerTodas = async () => {
  const result = await db.query('SELECT id, nombre, descripcion FROM productos.categorias ORDER BY id');
  return result.rows;
};

const crear = async (nombre, descripcion) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  
  const result = await db.query(
    'INSERT INTO productos.categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
    [nombre.trim(), descripcion || null]
  );
  return result.rows[0];
};

const actualizar = async (id, nombre, descripcion) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  
  const result = await db.query(
    'UPDATE productos.categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
    [nombre.trim(), descripcion || null, id]
  );
  
  if (result.rows.length === 0) throw new Error('Categoría no encontrada');
  return result.rows[0];
};

const eliminar = async (id) => {
  const result = await db.query('DELETE FROM productos.categorias WHERE id = $1 RETURNING id', [id]);
  if (result.rows.length === 0) throw new Error('Categoría no encontrada');
  return { id: result.rows[0].id };
};

module.exports = { obtenerTodas, crear, actualizar, eliminar };