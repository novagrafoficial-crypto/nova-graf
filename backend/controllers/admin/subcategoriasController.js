const subcategoriasModel = require("../../models/admin/subcategoriasModel");

const obtenerSubcategorias = async (req, res) => {
  try {
    const subcategorias = await subcategoriasModel.obtenerSubcategorias();
    res.json(subcategorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener subcategorías" });
  }
};

const crearSubcategoria = async (req, res) => {
  const { nombre, categoria_id } = req.body;
  try {
    const subcategoria = await subcategoriasModel.crearSubcategoria(nombre, categoria_id);
    res.json(subcategoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear subcategoría" });
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
    res.status(500).json({ error: "Error al actualizar subcategoría" });
  }
};

const eliminarSubcategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await subcategoriasModel.eliminarSubcategoria(id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar subcategoría" });
  }
};

module.exports = {
  obtenerSubcategorias,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
};