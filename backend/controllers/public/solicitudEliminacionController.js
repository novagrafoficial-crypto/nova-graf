// backend/controllers/public/solicitudEliminacionController.js
// Solicitud de eliminación de cuenta (requisito de Google Play).
// 1) Guarda la solicitud en public.solicitudes_eliminacion.
// 2) Avisa a los administradores (Avisos en la app y notificaciones en la web).
// No borra nada aquí: el admin la confirma desde la web (Gestión → Eliminación de cuentas).
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const { notificarAdmins } = require('../../models/admin/pedidosModel');

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Si la petición trae la sesión del usuario (app con sesión iniciada), devuelve su id; si no, null.
const usuarioDeLaSesion = (req) => {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET)?.id_usuario ?? null;
  } catch {
    return null;
  }
};

const solicitarEliminacion = async (req, res) => {
  const correo = String(req.body?.correo ?? '').trim().toLowerCase();
  const motivo = String(req.body?.motivo ?? '').trim().slice(0, 500) || null;
  const origen = req.body?.origen === 'app' ? 'APP' : 'WEB';

  if (!CORREO.test(correo)) {
    return res.status(400).json({ message: 'Escribe un correo válido.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id_usuario, nombre FROM public.usuarios WHERE LOWER(correo_electronico) = $1 LIMIT 1',
      [correo]
    );
    const usuario = rows[0] ?? null;
    // Verificada = la pidió desde su propia sesión (el correo es de la cuenta con la que entró)
    const verificada = !!usuario && usuarioDeLaSesion(req) === usuario.id_usuario;

    // Si ya tiene una pendiente, no se duplica
    const pendiente = await pool.query(
      `SELECT id FROM public.solicitudes_eliminacion WHERE correo = $1 AND estado = 'PENDIENTE' LIMIT 1`,
      [correo]
    );

    if (pendiente.rowCount === 0) {
      const { rows: nueva } = await pool.query(
        `INSERT INTO public.solicitudes_eliminacion (usuario_id, correo, motivo, origen, verificada)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [usuario?.id_usuario ?? null, correo, motivo, origen, verificada]
      );

      // Solo se avisa si el correo pertenece a una cuenta
      if (usuario) {
        await notificarAdmins(
          null,
          'SOLICITUD_ELIMINACION',
          'Solicitud de eliminación de cuenta',
          `Solicitud #${nueva[0].id}: ${usuario.nombre} (${correo}) pidió eliminar su cuenta desde la ${origen === 'APP' ? 'app' : 'web'}. Revísala en la web.`,
          '/admin/eliminacion-cuentas'
        );
      }
    }

    // Misma respuesta exista o no el correo (nadie puede averiguar qué correos están registrados)
    res.json({
      success: true,
      message: 'Recibimos tu solicitud. La atenderemos en un máximo de 30 días y te avisaremos por correo.',
    });
  } catch (error) {
    console.error('Error en solicitud de eliminación:', error);
    res.status(500).json({ message: 'No se pudo registrar la solicitud. Intenta más tarde.' });
  }
};

module.exports = { solicitarEliminacion };
