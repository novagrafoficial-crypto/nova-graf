// backend/controllers/userController.js
const userModel = require('../../models/public/userModel'); // Importamos el modelo

const registerUser = async (req, res) => {
  const {
    name,
    lastNameP,
    lastNameM,
    username,
    birthDate,
    address,
    phone,
    email,
    password,
    confirmPassword
  } = req.body;

  // Validación de los datos
  if (!name || !lastNameP || !username || !birthDate || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

  try {
    // Llamar al modelo para crear el usuario
    const newUser = await userModel.createUser({
      name,
      lastNameP,
      lastNameM,
      username,
      birthDate,
      address,
      phone,
      email,
      password
    });

    res.status(201).json({
      id_usuario: newUser.id_usuario,
      nombre: newUser.nombre,
      apellido_paterno: newUser.apellido_paterno,
      apellido_materno: newUser.apellido_materno,
      nombre_usuario: newUser.nombre_usuario,
      correo_electronico: newUser.correo_electronico,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

module.exports = { registerUser };
