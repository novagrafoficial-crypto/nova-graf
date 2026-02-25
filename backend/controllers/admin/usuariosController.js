const usuariosModel = require("../../models/admin/usuariosModel");

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await usuariosModel.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

const cambiarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    const usuario = await usuariosModel.cambiarRol(id, rol);
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar rol" });
  }
};

const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const usuario = await usuariosModel.cambiarEstado(id, activo);
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