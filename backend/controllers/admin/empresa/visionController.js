const visionModel = require("../../../models/admin/empresa/visionModel");

const obtenerVisiones = async (req, res) => {
  try {
    const visiones = await visionModel.obtenerVisiones();
    res.json(visiones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearVision = async (req, res) => {
  const { empresa_id, descripcion } = req.body;
  try {
    const vision = await visionModel.crearVision(empresa_id, descripcion);
    res.status(201).json(vision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarVision = async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;
  try {
    const vision = await visionModel.actualizarVision(id, descripcion);
    res.json(vision);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarVision = async (req, res) => {
  const { id } = req.params;
  try {
    await visionModel.eliminarVision(id);
    res.json({ mensaje: "Visión eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { obtenerVisiones, crearVision, actualizarVision, eliminarVision };