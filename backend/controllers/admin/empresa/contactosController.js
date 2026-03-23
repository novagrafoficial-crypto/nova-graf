const contactosModel = require("../../../models/admin/empresa/contactosModel");

const obtenerContactos = async (req, res) => {
  try {
    res.json(await contactosModel.obtenerContactos());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearContacto = async (req, res) => {
  const { empresa_id, tipo_contacto, valor_contacto } = req.body;
  try {
    const contacto = await contactosModel.crearContacto(empresa_id, tipo_contacto, valor_contacto);
    res.status(201).json(contacto);
  } catch (error) {
    res.status(error.message.includes("requerido") ? 400 : 500)
      .json({ error: error.message });
  }
};

const actualizarContacto = async (req, res) => {
  const { id } = req.params;
  const { tipo_contacto, valor_contacto } = req.body;
  try {
    const contacto = await contactosModel.actualizarContacto(id, tipo_contacto, valor_contacto);
    res.json(contacto);
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 500)
      .json({ error: error.message });
  }
};

const eliminarContacto = async (req, res) => {
  const { id } = req.params;
  try {
    await contactosModel.eliminarContacto(id);
    res.json({ mensaje: "Contacto eliminado" });
  } catch (error) {
    res.status(error.message.includes("no encontrado") ? 404 : 500)
      .json({ error: error.message });
  }
};

module.exports = { obtenerContactos, crearContacto, actualizarContacto, eliminarContacto };