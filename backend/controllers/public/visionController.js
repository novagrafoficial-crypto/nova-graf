// backend/controllers/public/visionController.js
const visionModel = require('../../models/public/visionModel');

const visionController = {

  async getVision(req, res) {
    try {
      const vision = await visionModel.getVision();
      
      if (!vision) {
        return res.status(404).json({ 
          success: false,
          message: 'No se encontró información de la visión' 
        });
      }

      res.status(200).json({
        success: true,
        data: vision
      });
    } catch (error) {
      console.error('Error en visionController.getVision:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = visionController;