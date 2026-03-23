const redesModel = require("../../../models/admin/empresa/redesModel");

const obtenerRedes = async (req, res) => {
  try {
    const redes = await redesModel.obtenerRedes();
    res.json(redes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearRed = async (req, res) => {
  const { empresa_id, red_social, url_red_social } = req.body;
  try {
    const red = await redesModel.crearRed(empresa_id, red_social, url_red_social);
    res.status(201).json(red);
  } catch (error) {
    res.status(error.message.includes("requerida") ? 400 : 500)
      .json({ error: error.message });
  }
};

const eliminarRed = async (req, res) => {
  const { id } = req.params;
  try {
    await redesModel.eliminarRed(id);
    res.json({ mensaje: "Red social eliminada" });
  } catch (error) {
    res.status(error.message.includes("no encontrada") ? 404 : 500)
      .json({ error: error.message });
  }
};

const actualizarRed = async (req, res) => {
  const { id } = req.params;
  const { red_social, url_red_social } = req.body;
  try {
    const red = await redesModel.actualizarRed(id, red_social, url_red_social);
    res.json(red);
  } catch (error) {
    res.status(error.message.includes("no encontrada") ? 404 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerRedes, crearRed, actualizarRed, eliminarRed };