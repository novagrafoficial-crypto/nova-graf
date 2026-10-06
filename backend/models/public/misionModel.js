// backend/models/public/misionModel.js
const pool = require('../../config/db');

const misionModel = {
  /**
   * Obtiene la misión (por ejemplo, la primera registrada o la más reciente)
   * @returns {Promise<Object>} Objeto con id, descripcion y fecha_creacion
   */
  async getMision() {
    try {
      const query = 'SELECT * FROM empresa.vw_mision';
      const { rows } = await pool.query(query);
      return rows[0] || null; // Devuelve null si no hay registros
    } catch (error) {
      throw new Error(`Error al obtener la misión: ${error.message}`);
    }
  }
};

module.exports = misionModel;