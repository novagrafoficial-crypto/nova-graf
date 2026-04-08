// backend/models/public/misionModel.js
const pool = require('../../config/db');

const visionModel = {
  /**
   * Obtiene la misión (por ejemplo, la primera registrada o la más reciente)
   * @returns {Promise<Object>} Objeto con id, descripcion y fecha_creacion
   */
  async getVision() {
    try {
      // Suponemos que queremos la primera misión (puedes cambiar el ORDER BY si es necesario)
      const query = 'SELECT * FROM empresa.vw_vision';
      const { rows } = await pool.query(query);
      return rows[0] || null; // Devuelve null si no hay registros
    } catch (error) {
      throw new Error(`Error al obtener la visión: ${error.message}`);
    }
  }
};

module.exports = visionModel;