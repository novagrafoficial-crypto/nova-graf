const client = require("../../../config/db");

// Obtener contactos
const obtenerContactos = async () => {
  const result = await client.query(`
    SELECT *
    FROM empresa.contactos_empresa
    ORDER BY contacto_id
  `);

  return result.rows;
};

// Crear contacto
const crearContacto = async (empresa_id, tipo_contacto, valor_contacto) => {
  const result = await client.query(
    `INSERT INTO empresa.contactos_empresa (empresa_id, tipo_contacto, valor_contacto)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [empresa_id, tipo_contacto, valor_contacto]
  );

  return result.rows[0];
};

// Eliminar contacto
const eliminarContacto = async (contacto_id) => {
  await client.query(
    `DELETE FROM empresa.contactos_empresa
     WHERE contacto_id = $1`,
    [contacto_id]
  );

  return { mensaje: "Contacto eliminado correctamente" };
};

module.exports = {
  obtenerContactos,
  crearContacto,
  eliminarContacto
};