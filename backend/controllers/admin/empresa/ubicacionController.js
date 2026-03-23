const ubicacionModel = require("../../../models/admin/empresa/ubicacionModel");

const obtenerUbicacion = async (req, res) => {
  try {
    const ubicacion = await ubicacionModel.obtenerUbicacion();
    res.json(ubicacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const guardarUbicacion = async (req, res) => {
  const { empresa_id, direccion, ciudad, pais, codigo_postal } = req.body;
  try {
    const ubicacion = await ubicacionModel.guardarUbicacion(
      empresa_id, direccion, ciudad, pais, codigo_postal
    );
    res.json(ubicacion);
  } catch (error) {
    res.status(error.message.includes("requerida") ? 400 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerUbicacion, guardarUbicacion };