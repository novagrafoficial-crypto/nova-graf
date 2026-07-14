const metodosPagoModel = require('../../models/admin/metodosPagoModel');

const obtenerMetodosPago = async (req, res) => {
  try {
    res.json(await metodosPagoModel.obtenerTodos());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerMetodoPago = async (req, res) => {
  try {
    const data = await metodosPagoModel.obtenerPorId(req.params.id);
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const actualizarMetodoPago = async (req, res) => {
  try {
    const data = await metodosPagoModel.actualizar(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const toggleActivo = async (req, res) => {
  try {
    const data = await metodosPagoModel.toggleActivo(req.params.id, req.body.activo);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const crearMetodoPago = async (req, res) => {
  try {
    const data = await metodosPagoModel.crear(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { obtenerMetodosPago, obtenerMetodoPago, actualizarMetodoPago, toggleActivo, crearMetodoPago };
