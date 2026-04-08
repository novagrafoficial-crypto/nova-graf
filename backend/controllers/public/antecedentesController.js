// backend/controllers/public/visionController.js
const visionModel = require('../../models/public/antecedentesModel');

const antecedentesController = {

  async getAntecedentes(req, res) {
    try {
      const antecedentes = await visionModel.getAntecedentes();
      
      if (!antecedentes) {
        return res.status(404).json({ 
          success: false,
          message: 'No se encontró información de los antecedentes' 
        });
      }

      res.status(200).json({
        success: true,
        data: antecedentes
      });
    } catch (error) {
      console.error('Error en antecedentesController.getAntecedentes:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = antecedentesController;