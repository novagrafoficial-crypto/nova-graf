const pool = require('../../config/db');

const PublicacionModel = {

  // ── PÚBLICO: Catálogo con variantes (colores + imágenes) ──────
  getProductosConVariantes: async () => {
    const res = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio_base,
        c.nombre   AS categoria,
        s.nombre   AS subcategoria,
        m.nombre   AS marca,
        mat.nombre AS material,

        JSON_AGG(
          JSON_BUILD_OBJECT(
            'variante_id',      pv.id,
            'sku',              pv.sku,
            'color',            col.nombre,
            'precio_adicional', pv.precio_adicional,
            'precio_final',     p.precio_base + COALESCE(pv.precio_adicional, 0),
            'imagen_url',       pv.imagen_url,
            'atributos', (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'tipo',  ta.nombre,
                  'valor', va.valor
                )
              )
              FROM productos.variante_atributos vat
              JOIN productos.tipos_atributo     ta  ON vat.tipo_atributo_id  = ta.id
              JOIN productos.valores_atributo   va  ON vat.valor_atributo_id = va.id
              WHERE vat.variante_id = pv.id
            )
          )
        ) AS variantes

      FROM productos.productos p
      LEFT JOIN productos.categorias         c   ON p.categoria_id    = c.id
      LEFT JOIN productos.subcategorias      s   ON p.subcategoria_id = s.id
      LEFT JOIN productos.marcas             m   ON p.marca_id        = m.id
      LEFT JOIN productos.materiales         mat ON p.material_id     = mat.id
      LEFT JOIN productos.producto_variantes pv  ON pv.producto_id   = p.id
                                               AND pv.activo = true
      LEFT JOIN productos.colores            col ON pv.color_id       = col.id

      WHERE p.publicado = true
        AND p.activo    = true

      GROUP BY p.id, c.nombre, s.nombre, m.nombre, mat.nombre
      ORDER BY p.id DESC
    `);
    return res.rows;
  },

  // ── ADMIN: Listado de productos con imagen de variante ────────
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
        p.activo,
        p.publicado,
        (
          SELECT pv.imagen_url 
          FROM productos.producto_variantes pv 
          WHERE pv.producto_id   = p.id 
            AND pv.imagen_url   IS NOT NULL 
            AND pv.activo        = true
          LIMIT 1
        ) AS imagen_url
      FROM productos.productos p
      LEFT JOIN productos.categorias    c   ON p.categoria_id    = c.id
      LEFT JOIN productos.subcategorias s   ON p.subcategoria_id = s.id
      LEFT JOIN productos.marcas        m   ON p.marca_id        = m.id
      LEFT JOIN productos.materiales    mat ON p.material_id     = mat.id
      ORDER BY p.id DESC
    `);
    return res.rows;
  },

  // ── ADMIN: Listado de portafolio ───────────────────────────────
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

  // ── PÚBLICO: Items publicados genérico ────────────────────────
  getPublicos: async (tabla) => {
    const tablaMap = {
      productos:  'productos.productos',
      portafolio: 'empresa.portafolio',
    };
    const res = await pool.query(
      `SELECT * FROM ${tablaMap[tabla]} WHERE publicado = true ORDER BY id DESC`
    );
    return res.rows;
  },

  // ── ADMIN: Toggle publicado/borrador ──────────────────────────
  togglePublicado: async (tabla, id, estado) => {
    const tablaMap = {
      productos:  'productos.productos',
      portafolio: 'empresa.portafolio',
    };
    const res = await pool.query(
      `UPDATE ${tablaMap[tabla]} SET publicado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    );
    return res.rows[0];
  }
};

module.exports = PublicacionModel;