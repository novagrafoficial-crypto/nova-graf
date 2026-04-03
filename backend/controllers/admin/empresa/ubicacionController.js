const ubicacionModel = require("../../../models/admin/empresa/ubicacionModel");

const obtenerUbicacion = async (req, res) => {
  try {
    res.json(await ubicacionModel.obtenerUbicacion());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearUbicacion = async (req, res) => {
  const { empresa_id, direccion, ciudad, pais, codigo_postal } = req.body;
  try {
    const u = await ubicacionModel.crearUbicacion(empresa_id, direccion, ciudad, pais, codigo_postal);
    res.status(201).json(u);
  } catch (error) {
    res.status(error.message.includes("requerida") ? 400 : 500)
      .json({ error: error.message });
  }
};

const actualizarUbicacion = async (req, res) => {
  const { id } = req.params;
  const { direccion, ciudad, pais, codigo_postal } = req.body;
  try {
    const u = await ubicacionModel.actualizarUbicacion(id, direccion, ciudad, pais, codigo_postal);
    res.json(u);
  } catch (error) {
    res.status(error.message.includes("no encontrada") ? 404 : 500)
      .json({ error: error.message });
  }
};

const eliminarUbicacion = async (req, res) => {
  const { id } = req.params;
  try {
    await ubicacionModel.eliminarUbicacion(id);
    res.json({ mensaje: "Ubicación eliminada" });
  } catch (error) {
    res.status(error.message.includes("no encontrada") ? 404 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerUbicacion, crearUbicacion, actualizarUbicacion, eliminarUbicacion };