const userModel = require('../../models/public/userModel');
const { sendOTPEmail } = require('../../config/sendgrid');

const registerUser = async (req, res) => {
  const { name, lastNameP, lastNameM, username, birthDate, address, phone, email, password, confirmPassword } = req.body;

  if (!name || !lastNameP || !username || !birthDate || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

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
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

const verifyUser = async (req, res) => {
  const { id_usuario, otp } = req.body;

  // Debug — borrar después
  console.log("Body recibido:", req.body);
  console.log("id_usuario:", id_usuario, typeof id_usuario);
  console.log("otp:", otp, typeof otp);

  if (!id_usuario || !otp) {
    return res.status(400).json({ message: 'ID de usuario y código son requeridos' });
  }

  try {
    // Sin parseInt — pasar directo
    const result = await userModel.verifyOTP(Number(id_usuario), String(otp));

    console.log("Resultado verifyOTP:", result); // Debug

    if (result.success) {
      return res.status(200).json({ message: result.message });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al verificar el código' });
  }
};

//Para el login del usurio
const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  try {
    const result = await userModel.loginUser(email, password);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    return res.status(200).json({
      message: 'Login exitoso',
      user: result.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

module.exports = { registerUser, verifyUser, loginUserController };
