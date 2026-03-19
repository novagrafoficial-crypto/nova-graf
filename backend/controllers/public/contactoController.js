// backend/controllers/public/contactoController.js
const contactoModel = require('../../models/public/contactoModel');

const contactoController = {
  async getContactos(req, res) {
    try {
      const contactos = await contactoModel.getContactos();
      res.status(200).json({ success: true, data: contactos });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = contactoController;