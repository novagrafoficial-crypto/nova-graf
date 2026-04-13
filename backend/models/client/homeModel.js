const pool = require('../../config/db');

const HomeModel = {

  // Productos destacados (los más recientes publicados)
  getProductosDestacados: async (limite = 6) => {
    const res = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio_base,
        c.nombre AS categoria_nombre,
        (
          SELECT pv.imagen_url
          FROM productos.producto_variantes pv
          WHERE pv.producto_id = p.id
            AND pv.imagen_url IS NOT NULL
            AND pv.activo = true
          LIMIT 1
        ) AS imagen_url,
        (
          SELECT MIN(p.precio_base + COALESCE(pv.precio_adicional, 0))
          FROM productos.producto_variantes pv
          WHERE pv.producto_id = p.id AND pv.activo = true
        ) AS precio_min,
        (
          SELECT COUNT(*)
          FROM productos.producto_variantes pv
          WHERE pv.producto_id = p.id AND pv.activo = true
        ) AS total_variantes
      FROM productos.productos p
      LEFT JOIN productos.categorias c ON p.categoria_id = c.id
      WHERE p.publicado = true AND p.activo = true
      ORDER BY p.id DESC
      LIMIT $1
    `, [limite]);
    return res.rows;
  },

  // Portfolio publicado (trabajos realizados)
  getPortafolioDestacado: async (limite = 4) => {
    const res = await pool.query(`
      SELECT 
        po.id,
        po.descripcion,
        po.imagen_url,
        po.fecha_creacion,
        p.nombre AS producto_nombre
      FROM empresa.portafolio po
      LEFT JOIN productos.productos p ON po.producto_id = p.id
      WHERE po.publicado = true
      ORDER BY po.id DESC
      LIMIT $1
    `, [limite]);
    return res.rows;
  },

  // Categorías disponibles con conteo de productos
  getCategorias: async () => {
    const res = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        COUNT(p.id) AS total_productos
      FROM productos.categorias c
      INNER JOIN productos.productos p ON p.categoria_id = c.id
      WHERE p.publicado = true AND p.activo = true
      GROUP BY c.id, c.nombre
      ORDER BY total_productos DESC
    `);
    return res.rows;
  },

  // Estadísticas rápidas para el hero
  getStats: async () => {
    const res = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM productos.productos WHERE publicado = true AND activo = true) AS total_productos,
        (SELECT COUNT(*) FROM empresa.portafolio WHERE publicado = true) AS total_portafolio,
        (SELECT COUNT(DISTINCT categoria_id) FROM productos.productos WHERE publicado = true AND activo = true) AS total_categorias
    `);
    return res.rows[0];
  }
};

module.exports = HomeModel;