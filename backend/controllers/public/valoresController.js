// backend/controllers/public/visionController.js
const valoresModel = require('../../models/public/valoresModel');

const valoresController = {

  async getValores(req, res) {
    try {
      const valores = await valoresModel.getValores();

      if (!valores) {
        return res.status(404).json({ 
          success: false,
          message: 'No se encontró información de los valores' 
        });
      }

      res.status(200).json({
        success: true,
        data: valores
      });
    } catch (error) {
      console.error('Error en valoresController.getValores:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = valoresController;