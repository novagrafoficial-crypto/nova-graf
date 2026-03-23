const pool = require('../../config/db');

const PublicacionModel = {

  // Para el cliente: solo los publicados
  getPublicos: async (tabla) => {
    const res = await pool.query(
      `SELECT * FROM ${tabla} WHERE publicado = true ORDER BY id DESC`
    );
    return res.rows;
  },

  // ADMIN - listado de productos
  getListadoProductosAdmin: async () => {
    const res = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        c.nombre   AS categoria,
        s.nombre   AS subcategoria,
        m.nombre   AS marca,
        mat.nombre AS material,
        p.precio_base,
        p.imagen_url,
        p.activo,
        p.publicado
      FROM productos.productos p
      LEFT JOIN productos.categorias    c   ON p.categoria_id    = c.id
      LEFT JOIN productos.subcategorias s   ON p.subcategoria_id = s.id
      LEFT JOIN productos.marcas        m   ON p.marca_id        = m.id
      LEFT JOIN productos.materiales    mat ON p.material_id     = mat.id
      ORDER BY p.id DESC
    `);

    return res.rows;
  },

  // ADMIN - listado portafolio
  getListadoPortafolioAdmin: async () => {
    const res = await pool.query(`
      SELECT 
        po.id,
        po.descripcion,
        po.imagen_url,
        po.publicado,
        po.fecha_creacion,
        p.nombre AS producto_nombre
      FROM empresa.portafolio po
      LEFT JOIN productos.productos p ON po.producto_id = p.id
      ORDER BY po.id DESC
    `);

    return res.rows;
  },

  // cambiar estado publicado
  togglePublicado: async (tabla, id, estado) => {
    const res = await pool.query(
      `UPDATE ${tabla} SET publicado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    );
    return res.rows[0];
  }
};

module.exports = PublicacionModel;