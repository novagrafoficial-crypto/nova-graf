const db = require('../../config/db');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');

// ─── HELPER ───────────────────────────────────────────────
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// ✅ Helper compartido para evitar duplicación (Sonar)
const generateAndSaveOTP = async (userId) => {
  const otp = generateOTP();
  const expiration = new Date(Date.now() + 10 * 60 * 1000);
  await db.query(
    'UPDATE usuarios SET codigo_otp = $1, otp_expiracion = $2 WHERE id_usuario = $3',
    [otp, expiration, userId]
  );
  return otp;
};

// ─── VERIFICAR EMAIL ──────────────────────────────────────
const checkEmailExists = async (email) => {
  const result = await db.query(
    'SELECT correo_electronico, proveedor FROM usuarios WHERE correo_electronico = $1',
    [email]
  );
  return result.rowCount === 0 ? null : result.rows[0];
};

// ─── REGISTRO MANUAL ─────────────────────────────────────
const createUser = async ({ name, lastNameP, lastNameM, username, birthDate, address, phone, email, password }) => {
const existing = await checkEmailExists(email); 
  if (existing) {
    if (existing.proveedor === 'google') {
      const err = new Error('Este correo ya está registrado con Google. Inicia sesión con Google.');
      err.status = 400;
      throw err;
    }
    if (existing.proveedor === 'facebook') {
      const err = new Error('Este correo ya está registrado con Facebook. Inicia sesión con Facebook.');
      err.status = 400;
      throw err;
    }
    const err = new Error('Este correo ya está registrado. Inicia sesión normalmente.');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

  const result = await db.query(`
    INSERT INTO usuarios
    (nombre, apellido_paterno, apellido_materno, nombre_usuario, fecha_nacimiento, 
     domicilio, telefono, correo_electronico, contrasena, codigo_otp, 
     otp_expiracion, activo, rol, proveedor)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING id_usuario, nombre, apellido_paterno, apellido_materno, 
              nombre_usuario, correo_electronico, rol, proveedor
  `, [
    name, lastNameP, lastNameM || null, username || null,
    birthDate || null, address || null, phone || null,
    email, hashedPassword, otp, otpExpiration,
    false, 'cliente', 'local'
  ]);

  return result.rows[0];
};

// ─── REGISTRO / LOGIN CON GOOGLE ─────────────────────────
const findOrCreateGoogleUser = async ({ googleId, nombre, apellido_paterno, apellido_materno, email }) => {

  let result = await db.query(
    'SELECT id_usuario, nombre, correo_electronico, rol, proveedor FROM usuarios WHERE google_id = $1',
    [googleId]
  );
  if (result.rowCount > 0) return result.rows[0];

  const existing = await checkEmailExists(email);
  if (existing) {
    if (existing.proveedor === 'local')    throw new Error('email_local');
    if (existing.proveedor === 'facebook') throw new Error('email_facebook');
  }

  result = await db.query(`
    INSERT INTO usuarios
    (nombre, apellido_paterno, apellido_materno, nombre_usuario, correo_electronico, 
     google_id, activo, rol, proveedor, contrasena)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id_usuario, nombre, correo_electronico, rol, proveedor
  `, [
    nombre, apellido_paterno, apellido_materno || null,
    email, email, googleId,
    true, 'cliente', 'google', 'GOOGLE_AUTH'
  ]);

  return result.rows[0];
};

// ─── LOGIN MANUAL ─────────────────────────────────────────
const loginUser = async (email, password) => {
  const result = await db.query(
    `SELECT id_usuario, nombre, correo_electronico, contrasena, activo, rol, proveedor 
     FROM usuarios WHERE correo_electronico = $1`,
    [email]
  );

  if (result.rowCount === 0)
    return { success: false, message: 'Correo o contraseña incorrectos' };

  const user = result.rows[0];

  if (user.proveedor === 'google')
    return { success: false, message: 'Este correo fue registrado con Google. Usa el botón de Google.' };
  if (user.proveedor === 'facebook')
    return { success: false, message: 'Este correo fue registrado con Facebook. Usa el botón de Facebook.' };
  if (!user.activo)
    return { success: false, message: 'Cuenta no activada. Revisa tu correo y verifica tu cuenta.' };

  const passwordMatch = await bcrypt.compare(password, user.contrasena);
  if (!passwordMatch)
    return { success: false, message: 'Correo o contraseña incorrectos' };

  return {
    success: true,
    user: {
      id_usuario:         user.id_usuario,
      nombre:             user.nombre,
      correo_electronico: user.correo_electronico,
      rol:                user.rol,
    }
  };
};

// ─── OTP REGISTRO ─────────────────────────────────────────
const verifyOTP = async (userId, otp) => {
  const result = await db.query(
    'SELECT codigo_otp, otp_expiracion FROM usuarios WHERE id_usuario = $1',
    [userId]
  );

  if (result.rowCount === 0)
    return { success: false, message: 'Usuario no encontrado' };

  const user = result.rows[0];

  if (String(user.codigo_otp) !== String(otp))
    return { success: false, message: 'Código incorrecto' };
  if (new Date() > new Date(user.otp_expiracion))
    return { success: false, message: 'Código expirado' };

  await db.query(
    'UPDATE usuarios SET activo = true, codigo_otp = NULL, otp_expiracion = NULL WHERE id_usuario = $1',
    [userId]
  );

  return { success: true, message: 'Cuenta activada exitosamente' };
};

const getOTPData = async (userId) => {
  const result = await db.query(
    'SELECT correo_electronico, codigo_otp FROM usuarios WHERE id_usuario = $1',
    [userId]
  );
  if (result.rowCount === 0) throw new Error('Usuario no encontrado');
  return result.rows[0];
};

// ─── BÚSQUEDAS ────────────────────────────────────────────
const findUserByEmail = async (email) => {
  const result = await db.query(
    `SELECT id_usuario, nombre, correo_electronico, activo, telefono, proveedor
     FROM usuarios WHERE correo_electronico = $1`,
    [email]
  );
  return result.rowCount === 0 ? null : result.rows[0];
};

const findUserById = async (id_usuario) => {
  const result = await db.query(
    'SELECT id_usuario, nombre, correo_electronico, activo FROM usuarios WHERE id_usuario = $1',
    [id_usuario]
  );
  return result.rowCount === 0 ? null : result.rows[0];
};

// ─── RECUPERACIÓN DE CONTRASEÑA ───────────────────────────
const saveRecoveryOTP = async (userId) => {
  return generateAndSaveOTP(userId); // ✅ usa helper
};

const verifyRecoveryOTP = async (userId, otp) => {
  const result = await db.query(
    'SELECT codigo_otp, otp_expiracion FROM usuarios WHERE id_usuario = $1',
    [userId]
  );
  if (result.rowCount === 0)
    return { success: false, message: 'Usuario no encontrado' };

  const user = result.rows[0];
  if (String(user.codigo_otp) !== String(otp))
    return { success: false, message: 'Código incorrecto' };
  if (new Date() > new Date(user.otp_expiracion))
    return { success: false, message: 'Código expirado' };

  return { success: true };
};

const resetPassword = async (userId, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query(
    'UPDATE usuarios SET contrasena = $1, codigo_otp = NULL, otp_expiracion = NULL WHERE id_usuario = $2',
    [hashed, userId]
  );
  return { success: true, message: 'Contraseña actualizada correctamente' };
};

// ─── PERFIL ───────────────────────────────────────────────
const getUserProfile = async (id_usuario) => {
  const result = await db.query(`
    SELECT id_usuario, nombre, apellido_paterno, apellido_materno,
           nombre_usuario, fecha_nacimiento, domicilio, telefono,
           correo_electronico, proveedor
    FROM usuarios WHERE id_usuario = $1
  `, [id_usuario]);

  return result.rowCount === 0 ? null : result.rows[0];
};

const updateUserProfile = async (id_usuario, fields) => {
  const { nombre, apellido_paterno, apellido_materno, nombre_usuario, fecha_nacimiento, domicilio, telefono } = fields;

  const result = await db.query(`
    UPDATE usuarios SET
      nombre             = COALESCE($1, nombre),
      apellido_paterno   = COALESCE($2, apellido_paterno),
      apellido_materno   = COALESCE($3, apellido_materno),
      nombre_usuario     = COALESCE($4, nombre_usuario),
      fecha_nacimiento   = COALESCE($5, fecha_nacimiento),
      domicilio          = COALESCE($6, domicilio),
      telefono           = COALESCE($7, telefono)
    WHERE id_usuario = $8
    RETURNING id_usuario, nombre, apellido_paterno, apellido_materno,
              nombre_usuario, fecha_nacimiento, domicilio, telefono,
              correo_electronico, proveedor
  `, [
    nombre || null, apellido_paterno || null, apellido_materno || null,
    nombre_usuario || null, fecha_nacimiento || null,
    domicilio || null, telefono || null,
    id_usuario
  ]);

  return result.rows[0];
};

// ─── REENVIAR OTP DE ACTIVACIÓN ───────────────────────────
const resendActivationOTP = async (userId) => {
  return generateAndSaveOTP(userId); // ✅ usa helper
};

// ─── OBTENER ID POR EMAIL ─────────────────────────────────
const getUserIdByEmail = async (email) => {
  const result = await db.query(
    'SELECT id_usuario FROM usuarios WHERE correo_electronico = $1',
    [email]
  );
  return result.rowCount === 0 ? null : result.rows[0];
};

// ─── EXPORTS ──────────────────────────────────────────────
module.exports = {
  createUser,
  findOrCreateGoogleUser,
  loginUser,
  verifyOTP,
  getOTPData,
  findUserByEmail,
  findUserById,
  saveRecoveryOTP,
  verifyRecoveryOTP,
  resetPassword,
  checkEmailExists,
  getUserProfile,
  updateUserProfile,
  resendActivationOTP,
  getUserIdByEmail,
};