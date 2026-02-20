// backend/models/userModel.js
const db = require('../../config/db');
const bcrypt = require('bcrypt');

// Función para generar OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000); // Genera un OTP de 6 dígitos

// Función para crear un usuario
const createUser = async ({
  name,
  lastNameP,
  lastNameM,
  username,
  birthDate,
  address,
  phone,
  email,
  password
}) => {
  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generar el OTP
  const otp = generateOTP();
  // Establecer la expiración del OTP (10 minutos en el futuro)
  const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // Expira en 10 minutos

  // Insertar el nuevo usuario en la base de datos
  const query = `
    INSERT INTO usuarios 
    (nombre, apellido_paterno, apellido_materno, nombre_usuario, fecha_nacimiento, domicilio, telefono, correo_electronico, contrasena, codigo_otp, otp_expiracion, activo)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id_usuario, nombre, apellido_paterno, apellido_materno, nombre_usuario, correo_electronico
  `;
  const values = [
    name, lastNameP, lastNameM, username, birthDate, address, phone, email, hashedPassword, otp, otpExpiration, false
  ];
  
  try {
    const result = await db.query(query, values);
    return result.rows[0]; // Devolvemos los datos del usuario registrado
  } catch (error) {
    throw error;
  }
};

// Función para verificar el OTP
const verifyOTP = async (userId, otp) => {
  const query = 'SELECT codigo_otp, otp_expiracion, activo FROM usuarios WHERE id_usuario = $1';
  const result = await db.query(query, [userId]);

  if (result.rowCount === 0) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  const user = result.rows[0];

  // Verificar si el OTP es correcto
  if (String(user.codigo_otp) !== String(otp)) {
    return { success: false, message: 'Código incorrecto' };
  }

  // Verificar si el OTP ha expirado
  const currentTime = new Date();
  if (currentTime > new Date(user.otp_expiracion)) {
    return { success: false, message: 'Código expirado' };
  }

  // Si el OTP es válido y no ha expirado, activar la cuenta
  const updateQuery = 'UPDATE usuarios SET activo = true WHERE id_usuario = $1';
  await db.query(updateQuery, [userId]);

  return { success: true, message: 'Cuenta activada exitosamente' };
};

// Al final del archivo, antes del module.exports
const getOTPData = async (userId) => {
  const query = 'SELECT correo_electronico, codigo_otp FROM usuarios WHERE id_usuario = $1';
  const result = await db.query(query, [userId]);
  if (result.rowCount === 0) throw new Error('Usuario no encontrado');
  return result.rows[0];
};

const loginUser = async (email, password) => {
  const query = 'SELECT id_usuario, nombre, correo_electronico, contrasena, activo, rol  FROM usuarios WHERE correo_electronico = $1';
  const result = await db.query(query, [email]);

  if (result.rowCount === 0) return { success: false, message: 'Correo o contraseña incorrectos' };

  const user = result.rows[0];

  if (user.proveedor === 'google') {
    return { success: false, message: 'Esta cuenta fue registrada con Google. Usa el botón de Google para iniciar sesión.' };
  }

  if (!user.activo) {
    return { success: false, message: 'Cuenta no activada. Revisa tu correo y verifica tu cuenta.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.contrasena);
  if (!passwordMatch) return { success: false, message: 'Correo o contraseña incorrectos' };

  return {
    success: true,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo_electronico: user.correo_electronico,
      rol: user.rol
    }
  };
};


// Actualizar module.exports
module.exports = { createUser, verifyOTP, getOTPData, loginUser };
