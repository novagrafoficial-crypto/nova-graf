// backend/models/public/ubicacionModel.js
const pool = require('../../config/db');

const ubicacionModel = {
  async getUbicacion() {
    try {
      const query = ` SELECT * from empresa.vw_ubicacion`;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener la ubicación: ${error.message}`);
    }
  }
};

module.exports = ubicacionModel;