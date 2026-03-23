const db = require('../../config/db');

const obtenerUsuarios = async () => {
  const result = await db.query(`
    SELECT id_usuario, nombre, apellido_paterno, apellido_materno,
           nombre_usuario, correo_electronico, telefono,
           rol, activo, proveedor, fecha_registro
    FROM usuarios
    ORDER BY fecha_registro DESC
  `);
  return result.rows;
};

const cambiarRol = async (id, rol) => {
  const result = await db.query(
    'UPDATE usuarios SET rol = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombre, correo_electronico, rol, activo',
    [rol, id]
  );
  if (result.rowCount === 0) throw new Error('Usuario no encontrado');
  return result.rows[0];
};

const cambiarEstado = async (id, activo) => {
  const result = await db.query(
    'UPDATE usuarios SET activo = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombre, correo_electronico, rol, activo',
    [activo, id]
  );
  if (result.rowCount === 0) throw new Error('Usuario no encontrado');
  return result.rows[0];
};

module.exports = { obtenerUsuarios, cambiarRol, cambiarEstado };