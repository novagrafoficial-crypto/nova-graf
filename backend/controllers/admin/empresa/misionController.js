const misionModel = require("../../../models/admin/empresa/misionModel");

const obtenerMisiones = async (req, res) => {
  try {
    const misiones = await misionModel.obtenerMisiones();
    res.json(misiones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearMision = async (req, res) => {
  const { empresa_id, descripcion } = req.body;
  try {
    const mision = await misionModel.crearMision(empresa_id, descripcion);
    res.status(201).json(mision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarMision = async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;
  try {
    const mision = await misionModel.actualizarMision(id, descripcion);
    res.json(mision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarMision = async (req, res) => {
  const { id } = req.params;
  try {
    await misionModel.eliminarMision(id);
    res.json({ mensaje: "Misión eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { obtenerMisiones, crearMision, actualizarMision, eliminarMision };