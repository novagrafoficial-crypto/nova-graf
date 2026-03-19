// backend/models/public/empresaModel.js
const pool = require('../../config/db');

const empresaModel = {
  async getEmpresa() {
    try {
      const query = `SELECT * from empresa.vw_empresa`;
      const { rows } = await pool.query(query);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener la empresa: ${error.message}`);
    }
  }
};

module.exports = empresaModel;