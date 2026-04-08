const db = require('../../config/db');

const obtenerSubcategorias = async () => {
  try {
    const result = await db.query(`
      SELECT 
        s.id, 
        s.nombre, 
        s.categoria_id, 
        c.nombre AS categoria_nombre,
        s.activo,
        s.fecha_creacion
      FROM productos.subcategorias s
      LEFT JOIN productos.categorias c 
        ON s.categoria_id = c.id
      WHERE s.activo = TRUE
      ORDER BY s.id ASC
    `);
    return result.rows;
  } catch (error) {
    console.error('💥 ERROR REAL EN SQL:', error.message);
    throw error;
  }
};

const crearSubcategoria = async (nombre, categoria_id) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  if (!categoria_id) throw new Error('La categoría es requerida');

  try {
    const result = await db.query(
      `INSERT INTO productos.subcategorias 
        (nombre, categoria_id, activo, fecha_creacion) 
       VALUES ($1, $2, TRUE, NOW()) 
       RETURNING *`,
      [nombre.trim(), categoria_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('💥 ERROR AL CREAR:', error.message);
    throw error;
  }
};

const actualizarSubcategoria = async (id, nombre, categoria_id) => {
  if (!id) throw new Error('El ID es requerido');
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  if (!categoria_id) throw new Error('La categoría es requerida');

  try {
    const result = await db.query(
      `UPDATE productos.subcategorias 
       SET nombre = $1, categoria_id = $2 
       WHERE id = $3 
       RETURNING *`,
      [nombre.trim(), categoria_id, id]
    );
    if (result.rowCount === 0) throw new Error('Subcategoría no encontrada');
    return result.rows[0];
  } catch (error) {
    console.error('💥 ERROR AL ACTUALIZAR:', error.message);
    throw error;
  }
};

const eliminarSubcategoria = async (id) => {
  if (!id) throw new Error('El ID es requerido');

  try {
    const result = await db.query(
      `UPDATE productos.subcategorias 
       SET activo = FALSE 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) throw new Error('Subcategoría no encontrada');
    return { mensaje: 'Subcategoría desactivada' };
  } catch (error) {
    console.error('💥 ERROR AL ELIMINAR:', error.message);
    throw error;
  }
};

module.exports = {
  obtenerSubcategorias,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria
};