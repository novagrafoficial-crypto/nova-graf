const Usuario = require('./Usuario');
const bcrypt = require('bcrypt');

// ─── HELPERS ──────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Mapear _id de MongoDB a id_usuario para que los controladores no cambien
const formatUser = (user) => ({
  id_usuario: user._id,
  nombre: user.nombre,
  apellido_paterno: user.apellido_paterno,
  ...(user.apellido_materno  && { apellido_materno: user.apellido_materno }),
  ...(user.nombre_usuario    && { nombre_usuario: user.nombre_usuario }),
  ...(user.fecha_nacimiento  && { fecha_nacimiento: user.fecha_nacimiento }),
  ...(user.domicilio         && { domicilio: user.domicilio }),
  ...(user.telefono          && { telefono: user.telefono }),
  correo_electronico: user.correo_electronico,
  rol: user.rol,
  proveedor: user.proveedor,
});

// ─── VERIFICAR EMAIL ──────────────────────────────────────
const checkEmailExists = async (email) => {
  const user = await Usuario.findOne({ correo_electronico: email });
  if (!user) return null;
  return { correo_electronico: user.correo_electronico, proveedor: user.proveedor };
};

// ─── REGISTRO MANUAL ─────────────────────────────────────
const createUser = async ({ name, lastNameP, lastNameM, username, birthDate, address, phone, email, password }) => {
  
  // Verificar duplicado
  const existing = await checkEmailExists(email);
  if (existing) {
    if (existing.proveedor === 'google')
      throw { status: 400, message: 'Este correo ya está registrado con Google. Inicia sesión con Google.' };
    if (existing.proveedor === 'facebook')
      throw { status: 400, message: 'Este correo ya está registrado con Facebook. Inicia sesión con Facebook.' };
    throw { status: 400, message: 'Este correo ya está registrado. Inicia sesión normalmente.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

  // Solo guarda campos que tienen valor
  const userData = {
    nombre: name,
    apellido_paterno: lastNameP,
    correo_electronico: email,
    contrasena: hashedPassword,
    codigo_otp: otp,
    otp_expiracion: otpExpiration,
    activo: false,
    rol: 'cliente',
    proveedor: 'local',
    ...(lastNameM  && { apellido_materno: lastNameM }),
    ...(username   && { nombre_usuario: username }),
    ...(birthDate  && { fecha_nacimiento: birthDate }),
    ...(address    && { domicilio: address }),
    ...(phone      && { telefono: phone }),
  };

  const newUser = await Usuario.create(userData);
  return formatUser(newUser);
};

// ─── REGISTRO / LOGIN CON GOOGLE ─────────────────────────

const findOrCreateGoogleUser = async ({ googleId, nombre, apellido_paterno, apellido_materno, email }) => {
  
  // 1. Buscar si ya existe por google_id
  let user = await Usuario.findOne({ google_id: googleId });
  if (user) return formatUser(user); // Ya existe → solo retornar

  // 2. Buscar si el correo ya existe con otro proveedor
  const existing = await Usuario.findOne({ correo_electronico: email });
  if (existing) {
    if (existing.proveedor === 'local')
      throw { message: 'email_local' }; // Redirige al login con error
    if (existing.proveedor === 'facebook')
      throw { message: 'email_facebook' };
  }

  // 3. Crear usuario nuevo con Google
  // Solo guarda los campos que Google realmente nos da
  const googleData = {
    nombre,
    apellido_paterno,
    correo_electronico: email,
    google_id: googleId,
    nombre_usuario: email, // Usamos el email como nombre de usuario por defecto
    activo: true,          // Google ya verificó el email
    rol: 'cliente',
    proveedor: 'google',
    ...(apellido_materno && { apellido_materno }),
  };

  const newUser = await Usuario.create(googleData);
  return formatUser(newUser);
};

// ─── LOGIN MANUAL ─────────────────────────────────────────
const loginUser = async (email, password) => {
  const user = await Usuario.findOne({ correo_electronico: email });
  
  if (!user) 
    return { success: false, message: 'Correo o contraseña incorrectos' };
  if (user.proveedor === 'google')
    return { success: false, message: 'Este correo fue registrado con Google. Usa el botón de Google.' };
  if (user.proveedor === 'facebook')
    return { success: false, message: 'Este correo fue registrado con Facebook. Usa el botón de Facebook.' };
  if (!user.activo)
    return { success: false, message: 'Cuenta no activada. Revisa tu correo y verifica tu cuenta.' };

  const passwordMatch = await bcrypt.compare(password, user.contrasena);
  if (!passwordMatch) 
    return { success: false, message: 'Correo o contraseña incorrectos' };

  return { success: true, user: formatUser(user) };
};

// ─── OTP REGISTRO ─────────────────────────────────────────
const verifyOTP = async (userId, otp) => {
  const user = await Usuario.findById(userId);
  if (!user) return { success: false, message: 'Usuario no encontrado' };
  if (String(user.codigo_otp) !== String(otp))
    return { success: false, message: 'Código incorrecto' };
  if (new Date() > new Date(user.otp_expiracion))
    return { success: false, message: 'Código expirado' };

  await Usuario.findByIdAndUpdate(userId, { 
    activo: true,
    $unset: { codigo_otp: '', otp_expiracion: '' } // ← borra los campos OTP al activar
  });
  return { success: true, message: 'Cuenta activada exitosamente' };
};

const getOTPData = async (userId) => {
  const user = await Usuario.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');
  return { correo_electronico: user.correo_electronico, codigo_otp: user.codigo_otp };
};

// ─── BÚSQUEDAS ──────────────────────
const findUserByEmail = async (email) => {
  const user = await Usuario.findOne({ correo_electronico: email });
  if (!user) return null;
  return {
    id_usuario: user._id,
    nombre: user.nombre,
    correo_electronico: user.correo_electronico,
    activo: user.activo,
    ...(user.telefono && { telefono: user.telefono }),
  };
};

const findUserById = async (id_usuario) => {
  const user = await Usuario.findById(id_usuario);
  if (!user) return null;
  return {
    id_usuario: user._id,
    nombre: user.nombre,
    correo_electronico: user.correo_electronico,
    activo: user.activo
  };
};

// ─── RECUPERACIÓN DE CONTRASEÑA ───────────────────────────
const saveRecoveryOTP = async (userId) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiration = new Date(Date.now() + 10 * 60 * 1000);
  await Usuario.findByIdAndUpdate(userId, { codigo_otp: otp, otp_expiracion: expiration });
  return otp;
};

const verifyRecoveryOTP = async (userId, otp) => {
  const user = await Usuario.findById(userId);
  if (!user) return { success: false, message: 'Usuario no encontrado' };
  if (String(user.codigo_otp) !== String(otp))
    return { success: false, message: 'Código incorrecto' };
  if (new Date() > new Date(user.otp_expiracion))
    return { success: false, message: 'Código expirado' };
  return { success: true };
};

const resetPassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await Usuario.findByIdAndUpdate(userId, {
    contrasena: hashedPassword,
    $unset: { codigo_otp: '', otp_expiracion: '' } // ← borra los campos OTP
  });
  return { success: true, message: 'Contraseña actualizada correctamente' };
};

// ─── PERFIL ────────────────────────────────
const getUserProfile = async (id_usuario) => {
  const user = await Usuario.findById(id_usuario);
  if (!user) return null;
  return formatUser(user);
};

// ____Solo actualiza campos que vienen con valor________
const updateUserProfile = async (id_usuario, fields) => {
  
  const updates = {};
  const allowed = ['nombre', 'apellido_paterno', 'apellido_materno', 'nombre_usuario', 'fecha_nacimiento', 'domicilio', 'telefono'];
  allowed.forEach(field => {
    if (fields[field] !== undefined && fields[field] !== '') {
      updates[field] = fields[field];
    }
  });

  const updated = await Usuario.findByIdAndUpdate(id_usuario, updates, { new: true });
  return formatUser(updated);
};

// _____REENVIAR CODIGO DE ACTIVACION EN CASO DE EXPIRACIÓN__________
const resendActivationOTP = async (userId) => {
  const otp = generateOTP();
  const expiration = new Date(Date.now() + 10 * 60 * 1000);
  await Usuario.findByIdAndUpdate(userId, { codigo_otp: otp, otp_expiracion: expiration });
  return otp;
};

// ─── EXPORTS ────────────────────────────
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
  resendActivationOTP
};