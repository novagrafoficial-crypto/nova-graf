const { OAuth2Client } = require('google-auth-library');
const db = require('../../config/db'); // Tu conexión a PostgreSQL
const { generarToken } = require('../../utils/jwt'); // Tu generador oficial de tokens web

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleMobileLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: "idToken de Google es requerido" });
  }

  try {
    // 1. Verificar el token con los servidores de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // 2. Buscar al usuario en PostgreSQL
    let result = await db.query(
      'SELECT id_usuario, nombre, correo_electronico, rol FROM usuarios WHERE correo_electronico = $1', 
      [email]
    );
    let user = result.rows[0]; // Extraemos el usuario encontrado

    // 3. Si no existe, registrarlo en la base de datos de inmediato
    if (!user) {
      const insertResult = await db.query(
        'INSERT INTO usuarios (nombre, correo_electronico, rol) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, correo_electronico, rol',
        [name, email, 'client'] // Rol por defecto 'client' igual que en la web
      );
      user = insertResult.rows[0];
    }

    // 4. Estructurar el objeto de sesión idéntico a tu flujo web
    const userData = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo_electronico: user.correo_electronico,
      rol: user.rol,
    };

    // 5. Emitir tu token oficial firmado por tu servidor
    const token = generarToken(userData);

    // 6. Responder a la App Móvil
    return res.status(200).json({
      id_usuario: userData.id_usuario,
      nombre: userData.nombre,
      correo_electronico: userData.correo_electronico,
      rol: userData.rol,
      token: token // El JWT que usará el celular
    });

  } catch (error) {
    console.error("Error en la autenticación móvil relacional:", error);
    return res.status(401).json({ success: false, message: "Autenticación de Google inválida o vencida" });
  }
};
