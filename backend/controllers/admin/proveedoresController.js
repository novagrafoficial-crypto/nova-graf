const proveedoresModel = require('../../models/admin/proveedoresModel');

const obtenerProveedores = async (req, res) => {
  try {
    const proveedores = await proveedoresModel.obtenerTodos();
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

const crearProveedor = async (req, res) => {
  try {
    const nuevo = await proveedoresModel.crear(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(err.message.includes('requerido') ? 400 : 500)
       .json({ error: err.message || 'Error al crear proveedor' });
  }
};

const actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await proveedoresModel.actualizar(id, req.body);
    res.json(actualizado);
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });

    res.status(err.message.includes('requerido') ? 400 : 500)
       .json({ error: err.message || 'Error al actualizar proveedor' });
  }
};

const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    await proveedoresModel.eliminar(id);
    res.json({ mensaje: 'Proveedor eliminado' });
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });

    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

module.exports = {
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};