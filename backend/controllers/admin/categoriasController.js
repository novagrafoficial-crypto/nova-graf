const categoriasModel = require('../../models/admin/categoriasModel');

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await categoriasModel.obtenerTodas();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;  // ← AGREGAR descripcion
    
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const nueva = await categoriasModel.crear(nombre, descripcion || null);  // ← Enviar descripcion
    res.status(201).json(nueva);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'La categoría ya existe' });
    res.status(err.message.includes('requerido') ? 400 : 500)
       .json({ error: err.message || 'Error al crear categoría' });
  }
};

const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;  // ← AGREGAR descripcion
    
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    const actualizada = await categoriasModel.actualizar(id, nombre, descripcion || null);  // ← Enviar descripcion
    res.json(actualizada);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'La categoría ya existe' });
    if (err.message.includes('no encontrada'))
      return res.status(404).json({ error: err.message });
    res.status(err.message.includes('requerido') ? 400 : 500)
       .json({ error: err.message || 'Error al actualizar categoría' });
  }
};

const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await categoriasModel.eliminar(id);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) {
    if (err.message.includes('no encontrada'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = { obtenerCategorias, crearCategoria, actualizarCategoria, eliminarCategoria };