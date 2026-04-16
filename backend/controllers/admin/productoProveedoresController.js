const productoProveedoresModel = require('../../models/admin/productoProveedoresModel');

const obtenerPorProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const data = await productoProveedoresModel.obtenerPorProducto(producto_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const agregar = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { proveedor_id, precio_costo } = req.body;
    if (!proveedor_id) return res.status(400).json({ error: 'El proveedor es requerido' });
    const data = await productoProveedoresModel.agregar(producto_id, proveedor_id, precio_costo);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Este proveedor ya está asignado al producto' });
    res.status(500).json({ error: err.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { precio_costo } = req.body;
    const data = await productoProveedoresModel.actualizar(id, precio_costo);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await productoProveedoresModel.eliminar(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { obtenerPorProducto, agregar, actualizar, eliminar };