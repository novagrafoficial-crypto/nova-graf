const marketingModel = require('../../models/admin/marketingModel');

const obtenerDescuentos = async (req, res) => {
  try {
    const data = await marketingModel.obtenerTodos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerDescuento = async (req, res) => {
  try {
    const data = await marketingModel.obtenerPorId(req.params.id);
    if (!data.descuento) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const crearDescuento = async (req, res) => {
  try {
    const { nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin, productos } = req.body;
    if (!nombre || !tipo || !valor) return res.status(400).json({ error: 'Faltan campos requeridos' });
    const descuento = await marketingModel.crear(nombre, tipo, valor, cantidad_minima || 1, fecha_inicio, fecha_fin);
    if (productos?.length > 0) {
      await marketingModel.asignarProductos(descuento.id, productos);
    }
    res.status(201).json(descuento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const actualizarDescuento = async (req, res) => {
  try {
    const { nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin, productos } = req.body;
    const descuento = await marketingModel.actualizar(req.params.id, nombre, tipo, valor, cantidad_minima, fecha_inicio, fecha_fin);
    if (productos) {
      await marketingModel.asignarProductos(req.params.id, productos);
    }
    res.json(descuento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const publicarDescuento = async (req, res) => {
  try {
    const descuento = await marketingModel.toggleActivo(req.params.id, req.body.activo);
    res.json(descuento);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const eliminarDescuento = async (req, res) => {
  try {
    await marketingModel.eliminar(req.params.id);
    res.json({ mensaje: 'Oferta eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { obtenerDescuentos, obtenerDescuento, crearDescuento, actualizarDescuento, publicarDescuento, eliminarDescuento };