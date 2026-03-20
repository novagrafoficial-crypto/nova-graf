// backend/models/client/productosModel.js
const pool = require('../../config/db');

// ─── CATÁLOGO RESUMIDO ───────────────────────────────────────────────────────
const getProductosCatalogo = async () => {
  const query = `
    SELECT
        p.id                          AS producto_id,
        p.nombre                      AS producto_nombre,
        p.descripcion,
        p.precio_base,
        c.nombre                      AS categoria,
        (
          SELECT pv2.imagen_url
          FROM productos.producto_variantes pv2
          WHERE pv2.producto_id = p.id AND pv2.activo = TRUE
          ORDER BY pv2.id
          LIMIT 1
        )                             AS imagen_url,
        json_agg(DISTINCT col.nombre)
          FILTER (WHERE col.nombre IS NOT NULL)  AS colores_disponibles,
        json_agg(
          json_build_object('color', col.nombre, 'imagen_url', pv.imagen_url)
        ) FILTER (WHERE col.nombre IS NOT NULL)  AS colores_imagenes
    FROM productos.productos p
    LEFT JOIN productos.categorias c ON p.categoria_id = c.id
    LEFT JOIN productos.producto_variantes pv
           ON pv.producto_id = p.id AND pv.activo = TRUE
    LEFT JOIN productos.colores col ON col.id = pv.color_id
    WHERE p.activo = TRUE
    GROUP BY p.id, c.nombre
    ORDER BY p.fecha_creacion DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// ─── DETALLE COMPLETO POR PRODUCTO ──────────────────────────────────────────
const getProductoDetalle = async (productoId) => {
  const query = `
    SELECT
        p.id                  AS producto_id,
        p.nombre              AS producto_nombre,
        p.descripcion,
        p.precio_base,
        c.nombre              AS categoria,
        s.nombre              AS subcategoria,
        m.nombre              AS marca,
        mat.nombre            AS material,
        pv.id                 AS variante_id,
        pv.precio_adicional,
        pv.imagen_url,
        col.nombre            AS color,
        json_agg(
            json_build_object(
                'tipo',  ta.nombre,
                'valor', va_valor.valor
            )
        ) FILTER (WHERE va_valor.id IS NOT NULL) AS atributos
    FROM productos.productos p
    LEFT JOIN productos.categorias c          ON p.categoria_id = c.id
    LEFT JOIN productos.subcategorias s       ON p.subcategoria_id = s.id
    LEFT JOIN productos.marcas m              ON p.marca_id = m.id
    LEFT JOIN productos.materiales mat        ON p.material_id = mat.id
    LEFT JOIN productos.producto_variantes pv
           ON pv.producto_id = p.id AND pv.activo = TRUE
    LEFT JOIN productos.colores col           ON pv.color_id = col.id
    LEFT JOIN productos.variante_atributos va ON va.variante_id = pv.id
    LEFT JOIN productos.tipos_atributo ta     ON va.tipo_atributo_id = ta.id
    LEFT JOIN productos.valores_atributo va_valor
           ON va.valor_atributo_id = va_valor.id
    WHERE p.activo = TRUE AND p.id = $1
    GROUP BY p.id, c.nombre, s.nombre, m.nombre, mat.nombre, pv.id, col.nombre
    ORDER BY pv.id;
  `;
  const { rows } = await pool.query(query, [productoId]);
  return rows;
};

// ─── CATEGORÍAS PARA EL SLIDER ───────────────────────────────────────────────
const getCategorias = async () => {
  const query = `
    SELECT DISTINCT c.id, c.nombre
    FROM productos.categorias c
    INNER JOIN productos.productos p ON p.categoria_id = c.id
    WHERE p.activo = TRUE
    ORDER BY c.nombre;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  getProductosCatalogo,
  getProductoDetalle,
  getCategorias,
};