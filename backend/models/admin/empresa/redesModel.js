const db = require("../../../config/db");

const obtenerRedes = async () => {
  const result = await db.query(`
    SELECT * FROM empresa.redes_sociales_empresa ORDER BY red_social_id
  `);
  return result.rows;
};

const crearRed = async (empresa_id, red_social, url_red_social) => {
  if (!red_social?.trim()) throw new Error("La red social es requerida");
  if (!url_red_social?.trim()) throw new Error("La URL es requerida");

  const result = await db.query(
    `INSERT INTO empresa.redes_sociales_empresa (empresa_id, red_social, url_red_social)
     VALUES ($1, $2, $3) RETURNING *`,
    [empresa_id, red_social.trim(), url_red_social.trim()]
  );
  return result.rows[0];
};

const eliminarRed = async (id) => {
  const result = await db.query(
    `DELETE FROM empresa.redes_sociales_empresa WHERE red_social_id = $1 RETURNING *`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Red social no encontrada");
  return result.rows[0];
};

const actualizarRed = async (id, red_social, url_red_social) => {
  if (!red_social?.trim()) throw new Error("La red social es requerida");
  if (!url_red_social?.trim()) throw new Error("La URL es requerida");
  const result = await db.query(
    `UPDATE empresa.redes_sociales_empresa SET red_social = $1, url_red_social = $2
     WHERE red_social_id = $3 RETURNING *`,
    [red_social.trim(), url_red_social.trim(), id]
  );
  if (result.rowCount === 0) throw new Error("Red social no encontrada");
  return result.rows[0];
};

module.exports = { obtenerRedes, crearRed, actualizarRed, eliminarRed };