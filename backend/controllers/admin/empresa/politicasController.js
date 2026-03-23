const politicasModel = require("../../../models/admin/empresa/politicasModel");

const obtenerPoliticas = async (req, res) => {
  try {
    res.json(await politicasModel.obtenerPoliticas());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearPolitica = async (req, res) => {
  const { empresa_id, descripcion } = req.body;
  try {
    const politica = await politicasModel.crearPolitica(empresa_id, descripcion);
    res.status(201).json(politica);
  } catch (error) {
    res.status(error.message.includes("requerida") ? 400 : 500)
      .json({ error: error.message });
  }
};

const actualizarPolitica = async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;
  try {
    const politica = await politicasModel.actualizarPolitica(id, descripcion);
    res.json(politica);
  } catch (error) {
    res.status(error.message.includes("no encontrada") ? 404 : 500)
      .json({ error: error.message });
  }
};

const eliminarPolitica = async (req, res) => {
  const { id } = req.params;
  try {
    await politicasModel.eliminarPolitica(id);
    res.json({ mensaje: "Política eliminada" });
  } catch (error) {
    res.status(error.message.includes("no encontrada") ? 404 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerPoliticas, crearPolitica, actualizarPolitica, eliminarPolitica };