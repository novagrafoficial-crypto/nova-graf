const { OAuth2Client } = require('google-auth-library');
const userModel = require('../../models/public/userModel');
const { generarToken } = require('../../utils/jwt');

// Audiences aceptados: los Client IDs de las plataformas donde se genera el idToken
const allowedAudiences = [
  process.env.GOOGLE_CLIENT_ID,               // Web
  process.env.GOOGLE_ANDROID_CLIENT_ID,       // Android (Expo Go)
  process.env.GOOGLE_ANDROID_PROD_CLIENT_ID,  // Android (Play Store, futuro)
].filter(Boolean);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleMobileLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'idToken de Google es requerido' });
  }

  // 1. Verificar el idToken con Google
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: allowedAudiences,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error('idToken de Google inválido:', error.message);
    return res.status(401).json({ success: false, message: 'Autenticación de Google inválida o vencida' });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ success: false, message: 'La cuenta de Google no tiene correo verificado' });
  }

  // 2. Buscar o crear el usuario (reutilizando la misma función que la web)
  try {
    const user = await userModel.findOrCreateGoogleUser({
      googleId: payload.sub,
      nombre: payload.name || payload.given_name || 'Usuario Google',
      apellido_paterno: payload.family_name || null,
      apellido_materno: null,
      email: payload.email,
    });

    // 3. Construir el objeto de sesión (idéntico al de la web)
    const userData = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo_electronico: user.correo_electronico,
      rol: user.rol,
    };

    // 4. Generar JWT (misma función que usa la web)
    const token = generarToken(userData);

    // 5. Responder a la app móvil
    return res.status(200).json({
      id_usuario: userData.id_usuario,
      nombre: userData.nombre,
      correo_electronico: userData.correo_electronico,
      rol: userData.rol,
      token,
    });

  } catch (error) {
    // Capturar error de email local
    if (error.message === 'email_local') {
      return res.status(400).json({
        success: false,
        message: 'Este correo ya está registrado con contraseña. Inicia sesión con tu correo y contraseña.',
      });
    }
    console.error('Error en login móvil con Google:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};