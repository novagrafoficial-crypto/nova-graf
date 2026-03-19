// backend/models/public/contactoModel.js
const pool = require('../../config/db');

const contactoModel = {
  async getContactos() {
    try {
      const query = `SELECT * from empresa.vw_contacto`;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener los contactos: ${error.message}`);
    }
  }
};

module.exports = contactoModel;