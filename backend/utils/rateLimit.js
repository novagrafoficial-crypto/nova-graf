const crearLimitador = ({ max, windowMs, mensaje, campoClave }) => {
  const intentos = new Map(); // clave -> { count, resetAt }

  // Limpieza periódica para que el Map no crezca sin control
  setInterval(() => {
    const ahora = Date.now();
    for (const [clave, v] of intentos) if (v.resetAt <= ahora) intentos.delete(clave);
  }, 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'desconocida';
    const extra = campoClave ? String(req.body?.[campoClave] ?? '').toLowerCase() : '';
    const clave = `${ip}|${extra}`;
    const ahora = Date.now();

    let registro = intentos.get(clave);
    if (!registro || registro.resetAt <= ahora) {
      registro = { count: 0, resetAt: ahora + windowMs };
      intentos.set(clave, registro);
    }

    registro.count += 1;

    if (registro.count > max) {
      const segundos = Math.ceil((registro.resetAt - ahora) / 1000);
      res.set('Retry-After', String(segundos));
      return res.status(429).json({
        message: mensaje || 'Demasiados intentos. Intenta de nuevo más tarde.',
      });
    }
    next();
  };
};

const MIN = 60 * 1000;

module.exports = {
  // 10 intentos de login cada 15 min por IP + correo
  limitLogin: crearLimitador({ max: 10, windowMs: 15 * MIN, campoClave: 'email',
    mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' }),
  // 5 intentos de código OTP cada 10 min por IP + usuario (el OTP dura 10 min)
  limitOtp: crearLimitador({ max: 5, windowMs: 10 * MIN, campoClave: 'id_usuario',
    mensaje: 'Demasiados intentos con el código. Solicita uno nuevo en unos minutos.' }),
  // 5 envíos de correo cada 15 min por IP + correo/usuario
  limitCorreo: crearLimitador({ max: 5, windowMs: 15 * MIN, campoClave: 'email',
    mensaje: 'Has solicitado demasiados códigos. Espera unos minutos.' }),
  limitReenvio: crearLimitador({ max: 5, windowMs: 15 * MIN, campoClave: 'id_usuario',
    mensaje: 'Has solicitado demasiados códigos. Espera unos minutos.' }),
  // 5 registros por hora por IP
  limitRegistro: crearLimitador({ max: 5, windowMs: 60 * MIN,
    mensaje: 'Demasiados registros desde este dispositivo. Intenta más tarde.' }),
  // 10 búsquedas de id por 15 min
  limitLookup: crearLimitador({ max: 10, windowMs: 15 * MIN, campoClave: 'email' }),
  // Para el restablecimiento (OTP + nueva contraseña)
  limitReset: crearLimitador({ max: 5, windowMs: 10 * MIN, campoClave: 'id_usuario',
    mensaje: 'Demasiados intentos. Solicita un código nuevo.' }),
};
