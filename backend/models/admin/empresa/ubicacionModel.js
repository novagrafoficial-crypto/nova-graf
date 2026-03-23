const db = require("../../../config/db");

const obtenerUbicacion = async () => {
  const result = await db.query(`
    SELECT * FROM empresa.ubicacion_empresa ORDER BY ubicacion_id
  `);
  return result.rows;
};

const guardarUbicacion = async (empresa_id, direccion, ciudad, pais, codigo_postal) => {
  if (!direccion?.trim()) throw new Error("La dirección es requerida");

  const existe = await db.query(
    `SELECT ubicacion_id FROM empresa.ubicacion_empresa WHERE empresa_id = $1`,
    [empresa_id]
  );

  let result;
  if (existe.rowCount > 0) {
    result = await db.query(
      `UPDATE empresa.ubicacion_empresa
       SET direccion = $1, ciudad = $2, pais = $3, codigo_postal = $4
       WHERE empresa_id = $5
       RETURNING *`,
      [direccion.trim(), ciudad?.trim(), pais?.trim(), codigo_postal?.trim(), empresa_id]
    );
  } else {
    result = await db.query(
      `INSERT INTO empresa.ubicacion_empresa (empresa_id, direccion, ciudad, pais, codigo_postal)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [empresa_id, direccion.trim(), ciudad?.trim(), pais?.trim(), codigo_postal?.trim()]
    );
  }

  return result.rows[0];
};

module.exports = { obtenerUbicacion, guardarUbicacion };