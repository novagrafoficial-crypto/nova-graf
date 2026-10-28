// backend/controllers/admin/solicitudesEliminacionController.js
const model = require('../../models/admin/solicitudesEliminacionModel');

const responderError = (res, e) => res.status(e.status || 500).json({ message: e.message || 'Error del servidor' });

const listar = async (req, res) => {
  try {
    res.json(await model.obtenerTodas());
  } catch (e) {
    responderError(res, e);
  }
};

const atender = async (req, res) => {
  try {
    res.json(await model.atender(Number(req.params.id), String(req.body?.notas ?? '').trim().slice(0, 500)));
  } catch (e) {
    responderError(res, e);
  }
};

const rechazar = async (req, res) => {
  const notas = String(req.body?.notas ?? '').trim().slice(0, 500);
  if (!notas) return res.status(400).json({ message: 'Escribe el motivo del rechazo.' });
  try {
    res.json(await model.rechazar(Number(req.params.id), notas));
  } catch (e) {
    responderError(res, e);
  }
};

module.exports = { listar, atender, rechazar };
