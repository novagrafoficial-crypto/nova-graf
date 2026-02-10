const User = require("../models/user.model");

// REGISTRO
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

  if (
    !name ||
    !lastNameP ||
    !lastNameM ||
    !username ||
    !birthDate ||
    !address ||
    !phone ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({
      message: "Todos los campos son obligatorios"
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: "Las contraseñas no coinciden"
    });
  }

  const newUser = new User(
    name,
    lastNameP,
    lastNameM,
    username,
    birthDate,
    address,
    phone,
    email,
    password
  );

  await User.create(newUser);

  return res.status(201).json({
    message: "Usuario registrado correctamente",
    user: newUser
  });
};


// LOGIN
const loginUser = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Correo y contraseña obligatorios"
    });
  }

  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(404).json({
      message: "Usuario no encontrado"
    });
  }

  if (user.password !== password) {
    return res.status(401).json({
      message: "Contraseña incorrecta"
    });
  }

  return res.status(200).json({
    message: "Inicio de sesión exitoso",
    user
  });
};

module.exports = { registerUser, loginUser };
