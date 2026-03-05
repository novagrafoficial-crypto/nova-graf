const subcategoriasModel = require("../../models/admin/subcategoriasModel");

const obtenerSubcategorias = async (req, res) => {
  try {
    const subcategorias = await subcategoriasModel.obtenerSubcategorias();
    res.json(subcategorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al obtener subcategorías" });
  }
};

const crearSubcategoria = async (req, res) => {
  const { nombre, categoria_id } = req.body;
  try {
    const subcategoria = await subcategoriasModel.crearSubcategoria(nombre, categoria_id);
    res.status(201).json(subcategoria);  // Cambié a 201 para creación
  } catch (err) {
    console.error(err);
    if (err.message.includes('requerido')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || "Error al crear subcategoría" });
  }
};

const actualizarSubcategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria_id } = req.body;
  try {
    const subcategoria = await subcategoriasModel.actualizarSubcategoria(id, nombre, categoria_id);
    res.json(subcategoria);
  } catch (err) {
    console.error(err);
    if (err.message.includes('requerido') || err.message.includes('no encontrada')) {
      return res.status(err.message.includes('no encontrada') ? 404 : 400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || "Error al actualizar subcategoría" });
  }
};

const eliminarSubcategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await subcategoriasModel.eliminarSubcategoria(id);
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message.includes('no encontrada')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || "Error al eliminar subcategoría" });
  }
};

module.exports = {
  obtenerSubcategorias,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
};