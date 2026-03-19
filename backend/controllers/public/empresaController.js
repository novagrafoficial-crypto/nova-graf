// backend/controllers/public/empresaController.js
const empresaModel = require('../../models/public/empresaModel');

const empresaController = {
  async getEmpresa(req, res) {
    try {
      const empresa = await empresaModel.getEmpresa();
      if (!empresa) {
        return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      }
      res.status(200).json({ success: true, data: empresa });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = empresaController;