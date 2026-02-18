// backend/models/userModel.js
const db = require('../../config/db'); // Importa la conexión de la base de datos
const bcrypt = require('bcrypt');

const createUser = async ({
  name,
  lastNameP,
  lastNameM,
  username,
  birthDate,
  address,
  phone,
  email,
  password
}) => {
  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insertar el nuevo usuario en la base de datos
  const query = `
    INSERT INTO usuarios 
    (nombre, apellido_paterno, apellido_materno, nombre_usuario, fecha_nacimiento, domicilio, telefono, correo_electronico, contrasena)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id_usuario, nombre, apellido_paterno, apellido_materno, nombre_usuario, correo_electronico
  `;
  const values = [name, lastNameP, lastNameM, username, birthDate, address, phone, email, hashedPassword];
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

module.exports = { createUser };
