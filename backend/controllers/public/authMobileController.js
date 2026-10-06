//se instalo nueva dependencia
const { OAuth2Client } = require('google-auth-library');
const db = require('../../config/db'); // Tu conexión a PostgreSQL
const { generarToken } = require('../../utils/jwt'); // Tu generador oficial de tokens web

// El idToken trae como "aud" el Client ID de la plataforma que lo pidió
// (Web, Android o iOS). Aceptamos los que estén configurados.
// Las variables que no existan se ignoran, así que por ahora basta con GOOGLE_CLIENT_ID.
const allowedAudiences = [
  process.env.GOOGLE_CLIENT_ID,          // Web (el que ya tienes)
  process.env.GOOGLE_ANDROID_CLIENT_ID,  // Android (se agrega después)
  process.env.GOOGLE_IOS_CLIENT_ID,      // iOS (opcional)
].filter(Boolean);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleMobileLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: "idToken de Google es requerido" });
  }

  // 1. Verificar el token con los servidores de Google (si falla: 401)
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: allowedAudiences,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("idToken de Google inválido:", error.message);
    return res.status(401).json({ success: false, message: "Autenticación de Google inválida o vencida" });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ success: false, message: "La cuenta de Google no tiene correo verificado" });
  }

  // 2. Buscar o crear al usuario en PostgreSQL (si falla la BD: 500)
  try {
    const { email, name } = payload;

    let result = await db.query(
      'SELECT id_usuario, nombre, correo_electronico, rol FROM usuarios WHERE LOWER(correo_electronico) = LOWER($1)',
      [email]
    );
    let user = result.rows[0];

    // Si no existe, registrarlo de inmediato
    if (!user) {
      // Compara con config/passport.js: usa las MISMAS columnas que el registro web
      const insertResult = await db.query(
        'INSERT INTO usuarios (nombre, correo_electronico, rol) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, correo_electronico, rol',
        [name, email, 'client'] // Rol por defecto 'client' igual que en la web
      );
      user = insertResult.rows[0];
    }

    // 3. Estructurar el objeto de sesión idéntico a tu flujo web
    const userData = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo_electronico: user.correo_electronico,
      rol: user.rol,
    };

    // 4. Emitir tu token oficial firmado por tu servidor
    const token = generarToken(userData);

    // 5. Responder a la App Móvil
    return res.status(200).json({
      id_usuario: userData.id_usuario,
      nombre: userData.nombre,
      correo_electronico: userData.correo_electronico,
      rol: userData.rol,
      token: token // El JWT que usará el celular
    });

  } catch (error) {
    console.error("Error de BD en login móvil con Google:", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};