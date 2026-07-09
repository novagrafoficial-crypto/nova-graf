const comprasModel = require('../../models/admin/comprasModel');

const obtenerCompras = async (req, res) => {
  try {
    res.json(await comprasModel.obtenerTodas());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerCompra = async (req, res) => {
  try {
    const data = await comprasModel.obtenerPorId(req.params.id);
    if (!data.compra) return res.status(404).json({ error: 'No encontrada' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const crearCompra = async (req, res) => {
  try {
    const { proveedor_id, observaciones, detalle } = req.body;
    if (!proveedor_id || !detalle?.length)
      return res.status(400).json({ error: 'Proveedor y detalle son requeridos' });
    const compra = await comprasModel.crear(proveedor_id, observaciones, detalle);
    res.status(201).json(compra);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminarCompra = async (req, res) => {
  try {
    await comprasModel.eliminar(req.params.id);
    res.json({ mensaje: 'Compra eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { obtenerCompras, obtenerCompra, crearCompra, eliminarCompra };