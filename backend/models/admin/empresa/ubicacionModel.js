const db = require("../../../config/db");

const obtenerUbicacion = async () => {
  const result = await db.query(`
    SELECT * FROM empresa.ubicacion_empresa ORDER BY ubicacion_id
  `);
  return result.rows;
};

const crearUbicacion = async (empresa_id, direccion, ciudad, pais, codigo_postal) => {
  if (!direccion?.trim()) throw new Error("La dirección es requerida");
  const result = await db.query(
    `INSERT INTO empresa.ubicacion_empresa (empresa_id, direccion, ciudad, pais, codigo_postal)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [empresa_id, direccion.trim(), ciudad?.trim(), pais?.trim(), codigo_postal?.trim()]
  );
  return result.rows[0];
};

const actualizarUbicacion = async (id, direccion, ciudad, pais, codigo_postal) => {
  if (!direccion?.trim()) throw new Error("La dirección es requerida");
  const result = await db.query(
    `UPDATE empresa.ubicacion_empresa
     SET direccion = $1, ciudad = $2, pais = $3, codigo_postal = $4
     WHERE ubicacion_id = $5 RETURNING *`,
    [direccion.trim(), ciudad?.trim(), pais?.trim(), codigo_postal?.trim(), id]
  );
  if (result.rowCount === 0) throw new Error("Ubicación no encontrada");
  return result.rows[0];
};

const eliminarUbicacion = async (id) => {
  const result = await db.query(
    `DELETE FROM empresa.ubicacion_empresa WHERE ubicacion_id = $1 RETURNING *`, [id]
  );
  if (result.rowCount === 0) throw new Error("Ubicación no encontrada");
  return result.rows[0];
};

module.exports = { obtenerUbicacion, crearUbicacion, actualizarUbicacion, eliminarUbicacion };