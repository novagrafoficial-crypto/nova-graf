// controllers/admin/categoriasController.js
const categoriasModel = require("../../models/admin/categoriasModel");

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await categoriasModel.obtenerCategorias();
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

const crearCategoria = async (req, res) => {
  const { nombre } = req.body;
  try {
    const categoria = await categoriasModel.crearCategoria(nombre);
    res.json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    const categoria = await categoriasModel.actualizarCategoria(id, nombre);
    res.json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

const eliminarCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await categoriasModel.eliminarCategoria(id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar categoría" });
  }
};

module.exports = {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};