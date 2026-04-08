const userModel = require('../../models/public/userModel');
const { sendOTPEmail, sendRecoveryEmail } = require('../../config/sendgrid'); 
const db = require('../../config/db');  // ← FALTABA
const jwt = require('jsonwebtoken');      // ← NUEVO
const bcrypt = require('bcrypt');          // ← por si no estaba importado

// ─── REGISTRO ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { name, lastNameP, lastNameM, username, birthDate, address, phone, email, password, confirmPassword } = req.body;

  if (!name || !lastNameP || !username || !birthDate || !email || !password || !confirmPassword)
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });

  try {
    const newUser = await userModel.createUser({ name, lastNameP, lastNameM, username, birthDate, address, phone, email, password });
    const { correo_electronico, codigo_otp } = await userModel.getOTPData(newUser.id_usuario);
    await sendOTPEmail(correo_electronico, codigo_otp);

    res.status(201).json({
      id_usuario: newUser.id_usuario, 
      nombre: newUser.nombre,
      correo_electronico: newUser.correo_electronico,
      message: 'Registro exitoso. Revisa tu correo para activar tu cuenta.',
    });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

// ─── VERIFICAR OTP REGISTRO ───────────────────────────────
const verifyUser = async (req, res) => {
  const { id_usuario, otp } = req.body;

  if (!id_usuario || !otp)
    return res.status(400).json({ message: 'ID de usuario y código son requeridos' });

  try {
    const result = await userModel.verifyOTP(id_usuario, String(otp));

    if (result.success)
      return res.status(200).json({ message: result.message });
    return res.status(400).json({ message: result.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar el código' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────
const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });

  try {
    const result = await userModel.loginUser(email, password);

    if (!result.success)
      return res.status(401).json({ message: result.message });

    // ✅ Generar token JWT
    const token = jwt.sign(
      { id_usuario: result.user.id_usuario, rol: result.user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Devolver token junto con el usuario
    return res.status(200).json({
      message: 'Login exitoso',
      user: result.user,
      token: token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};


// ─── RECUPERAR CONTRASEÑA ───────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: 'El correo es requerido' });

  try {
    const user = await userModel.findUserByEmail(email);

    if (!user)
      return res.status(200).json({ message: 'Si el correo existe, recibirás el código.', id_usuario: null });
    if (!user.activo)
      return res.status(400).json({ message: 'Cuenta no activada.' });

    const otp = await userModel.saveRecoveryOTP(user.id_usuario);
    await sendOTPEmail(user.correo_electronico, otp);

    return res.status(200).json({
      message: 'Código enviado a tu correo',
      id_usuario: user.id_usuario 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al enviar el código' });
  }
};


// ─── VERIFICAR OTP RECUPERACIÓN ─────────────
const verifyRecoveryOTP = async (req, res) => {
  const { id_usuario, otp } = req.body;

  if (!id_usuario || !otp)
    return res.status(400).json({ message: 'ID y código son requeridos' });

  try {
  
    const result = await userModel.verifyRecoveryOTP(id_usuario, String(otp));

    if (result.success)
      return res.status(200).json({ message: 'Código correcto', valid: true });
    return res.status(400).json({ message: result.message, valid: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar el código' });
  }
};


// ─── CAMBIAR CONTRASEÑA  (recuperación)───────────
const resetPasswordController = async (req, res) => {
  const { id_usuario, newPassword, confirmPassword } = req.body;

  if (!id_usuario || !newPassword || !confirmPassword)
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });

  try {
    
    const result = await userModel.resetPassword(id_usuario, newPassword);

    if (result.success)
      return res.status(200).json({ message: result.message });
    return res.status(400).json({ message: result.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
};


// ─── REENVIAR CÓDIGO RECUPERAR LA CONTRASEÑA────────────
const resendRecoveryOTP = async (req, res) => {
  const { id_usuario } = req.body;

  if (!id_usuario)
    return res.status(400).json({ message: 'ID de usuario requerido' });

  try {
    const user = await userModel.findUserById(id_usuario);
    if (!user)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    const otp = await userModel.saveRecoveryOTP(user.id_usuario);
    await sendRecoveryEmail(user.correo_electronico, otp); // ← corregido
    return res.status(200).json({ message: 'Código reenviado a tu correo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al reenviar el código' });
  }
};

//____REENVIAR CODIGO PARA ACTIVAR LA CUENTA_______
const resendActivationOTPController = async (req, res) => {
  const { id_usuario } = req.body;
  if (!id_usuario)
    return res.status(400).json({ message: 'ID de usuario requerido' });

  try {
    const user = await userModel.findUserById(id_usuario);
    if (!user)
      return res.status(404).json({ message: 'Usuario no encontrado' });
    if (user.activo)
      return res.status(400).json({ message: 'Esta cuenta ya está activada' });

    const otp = await userModel.resendActivationOTP(id_usuario);
    await sendOTPEmail(user.correo_electronico, otp); // ← email de activación
    return res.status(200).json({ message: 'Código reenviado a tu correo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al reenviar el código' });
  }
};

// Obtener id por email — solo para reenvío de activación
const getUserIdByEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Correo requerido' });

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.status(200).json({ id_usuario: user.id_usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar usuario' });
  }
};

 
// ─── PERFIL — GET ─────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const perfil = await userModel.getUserProfile(req.params.id);
    if (!perfil) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(perfil);
  } catch (error) {
    console.error('getProfile:', error.message);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};
 
// ─── PERFIL — PUT (datos personales) ─────────────────────
const putProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno,
            nombre_usuario, fecha_nacimiento, domicilio, telefono } = req.body;
 
    if (!nombre?.trim())
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    if (!apellido_paterno?.trim())
      return res.status(400).json({ message: 'El apellido paterno es obligatorio' });
    if (!nombre_usuario?.trim())
      return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
 
    // Verificar nombre_usuario duplicado
    const dup = await db.query(
      'SELECT id_usuario FROM usuarios WHERE nombre_usuario = $1 AND id_usuario <> $2',
      [nombre_usuario.trim(), id]
    );
    if (dup.rowCount > 0)
      return res.status(409).json({ message: 'Ese nombre de usuario ya está en uso' });
 
    const actualizado = await userModel.updateUserProfile(id, {
      nombre:           nombre.trim(),
      apellido_paterno: apellido_paterno.trim(),
      apellido_materno: apellido_materno?.trim()  || null,
      nombre_usuario:   nombre_usuario.trim(),
      fecha_nacimiento: fecha_nacimiento           || null,
      domicilio:        domicilio?.trim()          || null,
      telefono:         telefono?.trim()           || null,
    });
 
    if (!actualizado) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Perfil actualizado', user: actualizado });
  } catch (error) {
    console.error('putProfile:', error.message);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};
 
// ─── CONTRASEÑA — PUT (desde perfil, solo locales) ───────
const putPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual, nueva } = req.body;
 
    if (!actual || !nueva)
      return res.status(400).json({ message: 'Faltan campos' });
    if (nueva.length < 6)
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
 
    const row = await db.query(
      'SELECT contrasena, proveedor FROM usuarios WHERE id_usuario = $1', [id]
    );
    if (row.rowCount === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });
 
    const { contrasena, proveedor } = row.rows[0];
 
    if (proveedor === 'google')
      return res.status(403).json({ message: 'Las cuentas de Google no tienen contraseña local' });
 
    const ok = await bcrypt.compare(actual, contrasena);
    if (!ok) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
 
    const hash = await bcrypt.hash(nueva, 10);
    await db.query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hash, id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('putPassword:', error.message);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};
 
// ─── EXPORTS ──────────────────────────────────────────────

module.exports = {
  registerUser, verifyUser, loginUserController,
  forgotPassword, verifyRecoveryOTP, resetPasswordController, 
  resendRecoveryOTP, resendActivationOTPController, 
  getUserIdByEmail, getProfile, putProfile, putPassword
};