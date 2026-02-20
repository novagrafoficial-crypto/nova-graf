// backend/controllers/public/misionController.js
const misionModel = require('../../models/public/misionModel');

const misionController = {
  /**
   * GET /api/public/mision
   * Devuelve la misión en formato JSON
   */
  async getMision(req, res) {
    try {
      const mision = await misionModel.getMision();
      
      if (!mision) {
        return res.status(404).json({ 
          success: false,
          message: 'No se encontró información de la misión' 
        });
      }

      res.status(200).json({
        success: true,
        data: mision
      });
    } catch (error) {
      console.error('Error en misionController.getMision:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = misionController;