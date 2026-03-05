const Usuario = require("../../models/admin/usuariosModel.js");

// 🔎 Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select("-contrasena") // nunca enviar contraseña
      .sort({ createdAt: -1 });

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// 🔁 Cambiar rol
const cambiarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { rol },
      { new: true }
    ).select("-contrasena");

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar rol" });
  }
};

// 🔁 Cambiar estado (activo/inactivo)
const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { activo },
      { new: true }
    ).select("-contrasena");

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar estado" });
  }
};

module.exports = {
  obtenerUsuarios,
  cambiarRol,
  cambiarEstado,
};