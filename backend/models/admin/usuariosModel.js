const client = require('../../config/db');

// Obtener todos los usuarios (sin contraseña ni OTP)
const obtenerUsuarios = async () => {
  const result = await client.query(`
    SELECT 
      id_usuario,
      nombre,
      apellido_paterno,
      apellido_materno,
      nombre_usuario,
      correo_electronico,
      rol,
      activo,
      fecha_registro
    FROM usuarios
    ORDER BY id_usuario DESC
  `);

  return result.rows;
};

// Cambiar rol
const cambiarRol = async (id, rol) => {
  const result = await client.query(
    `UPDATE usuarios 
     SET rol = $1 
     WHERE id_usuario = $2 
     RETURNING id_usuario, rol`,
    [rol, id]
  );

  return result.rows[0];
};

// Activar / Desactivar
const cambiarEstado = async (id, activo) => {
  const result = await client.query(
    `UPDATE usuarios 
     SET activo = $1 
     WHERE id_usuario = $2 
     RETURNING id_usuario, activo`,
    [activo, id]
  );

  return result.rows[0];
};

module.exports = {
  obtenerUsuarios,
  cambiarRol,
  cambiarEstado,
};