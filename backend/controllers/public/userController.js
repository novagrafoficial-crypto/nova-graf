const userModel = require('../../models/public/userModel');
const { sendOTPEmail, sendRecoveryEmail } = require('../../config/sendgrid'); 

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

    return res.status(200).json({ message: 'Login exitoso', user: result.user });
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


// ─── CAMBIAR CONTRASEÑA ───────────
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

module.exports = {
  registerUser, verifyUser, loginUserController,
  forgotPassword, verifyRecoveryOTP, resetPasswordController, 
  resendRecoveryOTP, resendActivationOTPController, 
  getUserIdByEmail
};