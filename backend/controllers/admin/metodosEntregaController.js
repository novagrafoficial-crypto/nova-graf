const metodosEntregaModel = require('../../models/admin/metodosEntregaModel');

const obtenerMetodosEntrega = async (req, res) => {
  try { res.json(await metodosEntregaModel.obtenerTodos()); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const crearMetodoEntrega = async (req, res) => {
  try { res.status(201).json(await metodosEntregaModel.crear(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const actualizarMetodoEntrega = async (req, res) => {
  try { res.json(await metodosEntregaModel.actualizar(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const toggleActivo = async (req, res) => {
  try { res.json(await metodosEntregaModel.toggleActivo(req.params.id, req.body.activo)); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { obtenerMetodosEntrega, crearMetodoEntrega, actualizarMetodoEntrega, toggleActivo };