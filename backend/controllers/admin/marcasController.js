const marcasModel = require('../../models/admin/marcasModel');

// Obtener todas
const obtenerMarcas = async (_req, res) => {
  try {
    const marcas = await marcasModel.obtenerTodas();
    res.json(marcas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener marcas' });
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
    res.status(500).json({ error: 'Error al crear marca' });
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
    res.status(500).json({ error: 'Error al actualizar marca' });
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
    res.status(500).json({ error: 'Error al eliminar marca' });
  }
};

module.exports = {
  obtenerMarcas,
  crearMarca,
  actualizarMarca,
  eliminarMarca
};
