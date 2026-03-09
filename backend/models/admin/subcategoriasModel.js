const db = require('../../config/db');

const obtenerSubcategorias = async () => {
  const result = await db.query(`
    SELECT s.id, s.nombre, s.categoria_id, c.nombre AS categoria_nombre
    FROM subcategorias s
    LEFT JOIN categorias c ON s.categoria_id = c.id
    ORDER BY s.id ASC
  `);
  return result.rows;
};

const crearSubcategoria = async (nombre, categoria_id) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  if (!categoria_id)   throw new Error('La categoría es requerida');

  const result = await db.query(
    'INSERT INTO subcategorias (nombre, categoria_id) VALUES ($1, $2) RETURNING *',
    [nombre.trim(), categoria_id]
  );
  return result.rows[0];
};

const actualizarSubcategoria = async (id, nombre, categoria_id) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  if (!categoria_id)   throw new Error('La categoría es requerida');

  const result = await db.query(
    'UPDATE subcategorias SET nombre = $1, categoria_id = $2 WHERE id = $3 RETURNING *',
    [nombre.trim(), categoria_id, id]
  );
  if (result.rowCount === 0) throw new Error('Subcategoría no encontrada');
  return result.rows[0];
};

const eliminarSubcategoria = async (id) => {
  const result = await db.query(
    'DELETE FROM subcategorias WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) throw new Error('Subcategoría no encontrada');
  return { mensaje: 'Subcategoría eliminada' };
};

module.exports = { obtenerSubcategorias, crearSubcategoria, actualizarSubcategoria, eliminarSubcategoria };