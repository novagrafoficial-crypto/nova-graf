const valoresModel = require("../../../models/admin/empresa/valoresModel");

const obtenerValores = async (req, res) => {
  try {
    const valores = await valoresModel.obtenerValores();
    res.json(valores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearValor = async (req, res) => {
  const { empresa_id, valor, descripcion } = req.body;
  try {
    const nuevo = await valoresModel.crearValor(empresa_id, valor, descripcion);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(error.message.includes("requerido") ? 400 : 500)
      .json({ error: error.message });
  }
};

const actualizarValor = async (req, res) => {
  const { id } = req.params;
  const { valor, descripcion } = req.body;
  try {
    const actualizado = await valoresModel.actualizarValor(id, valor, descripcion);
    res.json(actualizado);
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 500)
      .json({ error: error.message });
  }
};

const eliminarValor = async (req, res) => {
  const { id } = req.params;
  try {
    await valoresModel.eliminarValor(id);
    res.json({ mensaje: "Valor eliminado" });
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerValores, crearValor, actualizarValor, eliminarValor };