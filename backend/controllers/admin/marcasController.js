const marcasModel = require('../../models/admin/marcasModel');  // Verifica el path

// Obtener todas
const obtenerMarcas = async (_req, res) => {
  try {
    const marcas = await marcasModel.obtenerTodas();
    res.json(marcas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error al obtener marcas' });
  }
};

// Crear
const crearMarca = async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevaMarca = await marcasModel.crear(nombre);
    res.status(201).json(nuevaMarca);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'La marca ya existe' });
    }
    res.status(error.message.includes('requerido') ? 400 : 500).json({ error: error.message || 'Error al crear marca' });
  }
};

// Actualizar
const actualizarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const marcaActualizada = await marcasModel.actualizar(id, nombre);
    res.json(marcaActualizada);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'La marca ya existe' });
    }
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(error.message.includes('requerido') ? 400 : 500).json({ error: error.message || 'Error al actualizar marca' });
  }
};

// Eliminar
const eliminarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    await marcasModel.eliminar(id);
    res.json({ mensaje: 'Marca eliminada correctamente' });
  } catch (error) {
    console.error(error);
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error al eliminar marca' });
  }
};

module.exports = {
  obtenerMarcas,
  crearMarca,
  actualizarMarca,
  eliminarMarca
};