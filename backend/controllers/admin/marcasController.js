const marcasModel = require('../../models/admin/marcasModel');

const obtenerMarcas = async (_req, res) => {
  try {
    const marcas = await marcasModel.obtenerTodas();
    res.json(marcas);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener marcas' });
  }
};

const crearMarca = async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevaMarca = await marcasModel.crear(nombre);
    res.status(201).json(nuevaMarca);
  } catch (error) {
    if (error.code === '23505') // ← PostgreSQL duplicate key (antes era 11000 de MongoDB)
      return res.status(400).json({ error: 'La marca ya existe' });
    res.status(error.message.includes('requerido') ? 400 : 500)
       .json({ error: error.message || 'Error al crear marca' });
  }
};

const actualizarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const marcaActualizada = await marcasModel.actualizar(id, nombre);
    res.json(marcaActualizada);
  } catch (error) {
    if (error.code === '23505')
      return res.status(400).json({ error: 'La marca ya existe' });
    if (error.message.includes('no encontrada'))
      return res.status(404).json({ error: error.message });
    res.status(error.message.includes('requerido') ? 400 : 500)
       .json({ error: error.message || 'Error al actualizar marca' });
  }
};

const eliminarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    await marcasModel.eliminar(id);
    res.json({ mensaje: 'Marca eliminada correctamente' });
  } catch (error) {
    if (error.message.includes('no encontrada'))
      return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message || 'Error al eliminar marca' });
  }
};

module.exports = { obtenerMarcas, crearMarca, actualizarMarca, eliminarMarca };