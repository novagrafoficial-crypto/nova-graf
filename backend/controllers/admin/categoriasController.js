const Categoria = require("../../models/admin/categoriasModel.js");

// Obtener todas
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ createdAt: -1 });
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

// Crear
const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const nuevaCategoria = await Categoria.create({ nombre });
    res.status(201).json(nuevaCategoria);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "La categoría ya existe" });
    }
    res.status(500).json({ error: "Error al crear categoría" });
  }
};

// Actualizar
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const categoria = await Categoria.findByIdAndUpdate(
      id,
      { nombre },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar categoría" });
  }
};

// Eliminar (por ahora lo dejamos como borrado físico, como tenías)
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByIdAndDelete(id);

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({ mensaje: "Categoría eliminada" });
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