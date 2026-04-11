const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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