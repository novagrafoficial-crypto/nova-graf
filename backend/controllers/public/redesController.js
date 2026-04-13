// backend/controllers/public/redesController.js
const redesModel = require('../../models/public/redesModel');

const redesController = {
  async getRedes(req, res) {
    try {
      const redes = await redesModel.getRedes();
      res.status(200).json({ success: true, data: redes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = redesController;