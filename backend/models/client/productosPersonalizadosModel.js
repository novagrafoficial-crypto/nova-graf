const pool = require('../../config/db');

const crearProductoPersonalizado = async (varianteId, solicitudDisenoId, textoPersonalizado, imagenUrl, precioAdicional) => {
  const query = `
    INSERT INTO productos.productos_personalizados 
      (variante_id, solicitud_diseno_id, texto_personalizado, imagen_personalizada_url, precio_adicional)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [varianteId, solicitudDisenoId || null, textoPersonalizado || null, imagenUrl, precioAdicional || 0];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = { crearProductoPersonalizado };