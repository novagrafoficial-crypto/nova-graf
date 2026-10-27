const jwt = require('jsonwebtoken');

// Sin secreto por defecto: si falta JWT_SECRET el servidor NO debe arrancar,
// porque firmaría los tokens con un valor público.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

const generarToken = (usuario) => {
  const payload = {
    id_usuario: usuario.id_usuario,
    correo: usuario.correo_electronico,
    rol: usuario.rol
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verificarToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generarToken, verificarToken };
