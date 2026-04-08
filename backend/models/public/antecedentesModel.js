// backend/models/public/antecedentesModel.js
const pool = require('../../config/db');

const antecedentesModel = {
  async getAntecedentes() {
    try {
      const query = `
        SELECT id, descripcion, fecha_evento, fecha_creacion, empresa_id
        FROM empresa.antecedentes
        ORDER BY fecha_evento ASC
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener los antecedentes: ${error.message}`);
    }
  }
};

module.exports = antecedentesModel;