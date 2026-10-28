// backend/models/admin/solicitudesEliminacionModel.js
const pool = require('../../config/db');

// Pendientes primero, luego las más recientes
const obtenerTodas = async () => {
  const { rows } = await pool.query(`
    SELECT s.*, u.nombre, u.apellido_paterno, u.proveedor, u.activo
    FROM public.solicitudes_eliminacion s
    LEFT JOIN public.usuarios u ON u.id_usuario = s.usuario_id
    ORDER BY (s.estado = 'PENDIENTE') DESC, s.fecha_solicitud DESC
  `);
  return rows;
};

// Confirmar: anonimiza los datos personales de la cuenta (como dice la política de privacidad)
// y marca la solicitud como ATENDIDA. Los pedidos y pagos se conservan.
const atender = async (id, notas) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM public.solicitudes_eliminacion WHERE id = $1 FOR UPDATE',
      [id]
    );
    const s = rows[0];
    if (!s) throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
    if (s.estado !== 'PENDIENTE') throw Object.assign(new Error('La solicitud ya fue atendida'), { status: 400 });

    if (s.usuario_id) {
      await client.query(
        `UPDATE public.usuarios SET
           nombre = 'Usuario',
           apellido_paterno = 'eliminado',
           apellido_materno = NULL,
           nombre_usuario = NULL,
           fecha_nacimiento = NULL,
           domicilio = NULL,
           telefono = NULL,
           correo_electronico = 'eliminado_' || id_usuario || '@eliminado.novagraf',
           google_id = NULL,
           contrasena = 'CUENTA_ELIMINADA',
           codigo_otp = NULL,
           otp_expiracion = NULL,
           activo = FALSE
         WHERE id_usuario = $1`,
        [s.usuario_id]
      );
    }

    const { rows: hecha } = await client.query(
      `UPDATE public.solicitudes_eliminacion
         SET estado = 'ATENDIDA', fecha_atendida = NOW(), notas_admin = $2
       WHERE id = $1 RETURNING *`,
      [id, notas || null]
    );
    await client.query('COMMIT');
    return hecha[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// Rechazar: por ejemplo, si no se pudo confirmar que el dueño del correo la pidió
const rechazar = async (id, notas) => {
  const { rows } = await pool.query(
    `UPDATE public.solicitudes_eliminacion
       SET estado = 'RECHAZADA', fecha_atendida = NOW(), notas_admin = $2
     WHERE id = $1 AND estado = 'PENDIENTE' RETURNING *`,
    [id, notas || null]
  );
  if (!rows[0]) throw Object.assign(new Error('La solicitud no existe o ya fue atendida'), { status: 400 });
  return rows[0];
};

module.exports = { obtenerTodas, atender, rechazar };
