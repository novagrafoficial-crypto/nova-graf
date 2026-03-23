const contactosModel = require("../../../models/admin/empresa/contactosModel");

const obtenerContactos = async (req, res) => {
  try {
    const contactos = await contactosModel.obtenerContactos();
    res.json(contactos);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

const crearContacto = async (req, res) => {
  const { empresa_id, tipo_contacto, valor_contacto } = req.body;

  try {
    const contacto = await contactosModel.crearContacto(
      empresa_id,
      tipo_contacto,
      valor_contacto
    );

    res.json(contacto);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenerContactos,
  crearContacto
};