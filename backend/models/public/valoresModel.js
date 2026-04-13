const pool = require('../../config/db');

const valoresModel = {
  async getValores() {
    try {
      const query = 'SELECT * FROM empresa.vw_valores';
      const { rows } = await pool.query(query);
      return rows; // <-- devolver todo el array
    } catch (error) {
      throw new Error(`Error al obtener los valores: ${error.message}`);
    }
  }
};

module.exports = valoresModel;