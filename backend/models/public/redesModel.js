// backend/models/public/redesModel.js
const pool = require('../../config/db');

const redesModel = {
  async getRedes() {
    try {
      const query = `SELECT * from empresa.vw_redes`;
      const { rows } = await pool.query(query);
      return rows; // Devuelve todas las redes
    } catch (error) {
      throw new Error(`Error al obtener las redes sociales: ${error.message}`);
    }
  }
};

module.exports = redesModel;