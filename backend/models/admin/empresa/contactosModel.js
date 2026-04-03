const db = require("../../../config/db");

const obtenerContactos = async () => {
  const result = await db.query(`
    SELECT * FROM empresa.contactos_empresa ORDER BY contacto_id
  `);
  return result.rows;
};

const crearContacto = async (empresa_id, tipo_contacto, valor_contacto) => {
  if (!tipo_contacto?.trim()) throw new Error("El tipo es requerido");
  if (!valor_contacto?.trim()) throw new Error("El valor es requerido");
  const result = await db.query(
    `INSERT INTO empresa.contactos_empresa (empresa_id, tipo_contacto, valor_contacto)
     VALUES ($1, $2, $3) RETURNING *`,
    [empresa_id, tipo_contacto.trim(), valor_contacto.trim()]
  );
  return result.rows[0];
};

const actualizarContacto = async (id, tipo_contacto, valor_contacto) => {
  if (!tipo_contacto?.trim()) throw new Error("El tipo es requerido");
  if (!valor_contacto?.trim()) throw new Error("El valor es requerido");
  const result = await db.query(
    `UPDATE empresa.contactos_empresa SET tipo_contacto = $1, valor_contacto = $2
     WHERE contacto_id = $3 RETURNING *`,
    [tipo_contacto.trim(), valor_contacto.trim(), id]
  );
  if (result.rowCount === 0) throw new Error("Contacto no encontrado");
  return result.rows[0];
};

const eliminarContacto = async (id) => {
  const result = await db.query(
    `DELETE FROM empresa.contactos_empresa WHERE contacto_id = $1 RETURNING *`, [id]
  );
  if (result.rowCount === 0) throw new Error("Contacto no encontrado");
  return result.rows[0];
};

module.exports = { obtenerContactos, crearContacto, actualizarContacto, eliminarContacto };