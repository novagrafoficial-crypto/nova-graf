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

const buscarOCrearProductoPersonalizado = async (varianteId, textoPersonalizado, imagenUrl, precioAdicional) => {
  // 1. Buscar si ya existe uno idéntico (activo)
  const queryBuscar = `
    SELECT * FROM productos.productos_personalizados
    WHERE variante_id = $1
      AND texto_personalizado = $2
      AND imagen_personalizada_url = $3
      AND activo = true
    LIMIT 1;
  `;
  const { rows: existentes } = await pool.query(queryBuscar, [varianteId, textoPersonalizado || '', imagenUrl]);
  if (existentes.length > 0) {
    return existentes[0];
  }

  // 2. Si no existe, crearlo
  const queryInsertar = `
    INSERT INTO productos.productos_personalizados 
      (variante_id, texto_personalizado, imagen_personalizada_url, precio_adicional)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await pool.query(queryInsertar, [varianteId, textoPersonalizado || '', imagenUrl, precioAdicional || 0]);
  return rows[0];
};

module.exports = { crearProductoPersonalizado, buscarOCrearProductoPersonalizado };