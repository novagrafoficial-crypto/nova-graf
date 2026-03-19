// backend/controllers/public/ubicacionController.js
const ubicacionModel = require('../../models/public/ubicacionModel');

const ubicacionController = {
  async getUbicacion(req, res) {
    try {
      const ubicaciones = await ubicacionModel.getUbicacion();
      res.status(200).json({ success: true, data: ubicaciones });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = ubicacionController;