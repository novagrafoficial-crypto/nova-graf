const antecedentesModel = require("../../../models/admin/empresa/antecedentesModel");

const obtenerAntecedentes = async (req, res) => {
  try {
    res.json(await antecedentesModel.obtenerAntecedentes());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearAntecedente = async (req, res) => {
  const { empresa_id, descripcion, fecha_evento } = req.body;
  try {
    const a = await antecedentesModel.crearAntecedente(empresa_id, descripcion, fecha_evento);
    res.status(201).json(a);
  } catch (error) {
    res.status(error.message.includes("requerida") ? 400 : 500)
      .json({ error: error.message });
  }
};

const actualizarAntecedente = async (req, res) => {
  const { id } = req.params;
  const { descripcion, fecha_evento } = req.body;
  try {
    const a = await antecedentesModel.actualizarAntecedente(id, descripcion, fecha_evento);
    res.json(a);
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 500)
      .json({ error: error.message });
  }
};

const eliminarAntecedente = async (req, res) => {
  const { id } = req.params;
  try {
    await antecedentesModel.eliminarAntecedente(id);
    res.json({ mensaje: "Antecedente eliminado" });
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerAntecedentes, crearAntecedente, actualizarAntecedente, eliminarAntecedente };