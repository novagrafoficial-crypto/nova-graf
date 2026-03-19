// models/public/catalogoModel.js
// Una tarjeta por PRODUCTO  (no por variante ni por color)
// Imagen  → primera variante activa con imagen
// Colores → todas las variantes agrupadas
// Atributos → todos los tipos+valores del producto
// Precio  → min y max entre todas las variantes
const db = require('../../config/db');

// ═══════════════════════════════════════════
// 1. CATEGORÍAS  (barra de selección)
// ═══════════════════════════════════════════
const obtenerCategorias = async () => {
  const r = await db.query(`SELECT * from  productos.vw_catalogo`);
  return r.rows;
};

// ═══════════════════════════════════════════
// 2. FILTROS según categoría elegida
//    → subcategorías, colores, atributos, precio
// ═══════════════════════════════════════════
const obtenerFiltros = async (categoria_id = null, subcategoria_id = null) => {
  const base = ['p.activo = TRUE', 'pv.activo = TRUE'];
  if (categoria_id)    base.push(`p.categoria_id    = ${parseInt(categoria_id)}`);
  if (subcategoria_id) base.push(`p.subcategoria_id = ${parseInt(subcategoria_id)}`);
  const cond = base.join(' AND ');

  const [subcats, colores, precios, tiposRaw, marcas, materiales] = await Promise.all([
    // Subcategorías (solo si hay categoría)
    categoria_id ? db.query(`
      SELECT s.id, s.nombre, COUNT(DISTINCT p.id) AS total
      FROM productos.subcategorias s
      INNER JOIN productos.productos p ON p.subcategoria_id = s.id
        AND p.activo = TRUE
        AND p.categoria_id = ${parseInt(categoria_id)}
      WHERE s.activo = TRUE
      GROUP BY s.id, s.nombre ORDER BY s.nombre
    `) : Promise.resolve({ rows: [] }),

    // Colores disponibles
    db.query(`
      SELECT DISTINCT col.id, col.nombre
      FROM productos.colores col
      INNER JOIN productos.producto_variantes pv ON pv.color_id = col.id AND pv.activo = TRUE
      INNER JOIN productos.productos p ON p.id = pv.producto_id AND ${cond}
      ORDER BY col.nombre
    `),

    // Rango de precio
    db.query(`
      SELECT
        MIN(p.precio_base + COALESCE(pv.precio_adicional,0))::numeric AS precio_min,
        MAX(p.precio_base + COALESCE(pv.precio_adicional,0))::numeric AS precio_max
      FROM productos.producto_variantes pv
      INNER JOIN productos.productos p ON p.id = pv.producto_id AND ${cond}
    `),

    // Tipos de atributo + valores (solo los que existen en esta cat/subcat)
    db.query(`
      SELECT DISTINCT ta.id AS tipo_id, ta.nombre AS tipo_nombre,
        va_v.id AS valor_id, va_v.valor AS valor_nombre
      FROM productos.tipos_atributo ta
      INNER JOIN productos.variante_atributos va ON va.tipo_atributo_id = ta.id
      INNER JOIN productos.producto_variantes pv ON pv.id = va.variante_id AND pv.activo = TRUE
      INNER JOIN productos.productos p ON p.id = pv.producto_id AND ${cond}
      INNER JOIN productos.valores_atributo va_v ON va_v.id = va.valor_atributo_id AND va_v.activo = TRUE
      WHERE ta.activo = TRUE
      ORDER BY ta.nombre, va_v.valor
    `),

    // Marcas
    db.query(`
      SELECT DISTINCT m.id, m.nombre
      FROM productos.marcas m
      INNER JOIN productos.productos p ON p.marca_id = m.id AND ${cond}
      INNER JOIN productos.producto_variantes pv ON pv.producto_id = p.id AND pv.activo = TRUE
      WHERE m.activo = TRUE ORDER BY m.nombre
    `),

    // Materiales
    db.query(`
      SELECT DISTINCT mat.id, mat.nombre
      FROM productos.materiales mat
      INNER JOIN productos.productos p ON p.material_id = mat.id AND ${cond}
      INNER JOIN productos.producto_variantes pv ON pv.producto_id = p.id AND pv.activo = TRUE
      ORDER BY mat.nombre
    `),
  ]);

  // Agrupar tipos con sus valores
  const tiposMap = {};
  tiposRaw.rows.forEach(r => {
    if (!tiposMap[r.tipo_id])
      tiposMap[r.tipo_id] = { id: r.tipo_id, nombre: r.tipo_nombre, valores: [] };
    tiposMap[r.tipo_id].valores.push({ id: r.valor_id, valor: r.valor_nombre });
  });

  return {
    subcategorias:  subcats.rows,
    colores:        colores.rows,
    tiposAtributo:  Object.values(tiposMap),
    precios:        precios.rows[0] || { precio_min: 0, precio_max: 9999 },
    marcas:         marcas.rows,
    materiales:     materiales.rows,
  };
};

// ═══════════════════════════════════════════
// 3. LISTADO — UNA TARJETA POR PRODUCTO
//    Incluye imagen, colores, atributos,
//    precio min/max de todas sus variantes.
// ═══════════════════════════════════════════
const listarProductos = async ({
  busqueda        = '',
  categoria_id    = null,
  subcategoria_id = null,
  marca_id        = null,
  material_id     = null,
  color_ids       = [],
  precio_min      = null,
  precio_max      = null,
  atributos       = {},       // { tipo_id: [valor_id, ...] }
  orden           = 'reciente',
  pagina          = 1,
  por_pagina      = 12,
} = {}) => {

  const params = [];
  const where  = ['p.activo = TRUE'];
  const idx    = () => `$${params.length}`;

  if (busqueda?.trim()) {
    params.push(`%${busqueda.trim()}%`);
    const n = params.length;
    where.push(`(p.nombre ILIKE $${n} OR p.descripcion ILIKE $${n})`);
  }
  if (categoria_id)    { params.push(parseInt(categoria_id));    where.push(`p.categoria_id = ${idx()}`); }
  if (subcategoria_id) { params.push(parseInt(subcategoria_id)); where.push(`p.subcategoria_id = ${idx()}`); }
  if (marca_id)        { params.push(parseInt(marca_id));        where.push(`p.marca_id = ${idx()}`); }
  if (material_id)     { params.push(parseInt(material_id));     where.push(`p.material_id = ${idx()}`); }

  // Filtro por colores: el producto debe tener al menos una variante con ese color
  if (color_ids?.length > 0) {
    const ids = color_ids.map(Number).filter(Boolean);
    if (ids.length) {
      params.push(ids);
      where.push(`EXISTS (
        SELECT 1 FROM productos.producto_variantes pv_c
        WHERE pv_c.producto_id = p.id AND pv_c.activo = TRUE
          AND pv_c.color_id = ANY(${idx()})
      )`);
    }
  }

  // Filtro por precio (sobre el mínimo del producto)
  if (precio_min !== null && precio_min !== '') {
    params.push(parseFloat(precio_min));
    where.push(`EXISTS (
      SELECT 1 FROM productos.producto_variantes pv_p
      WHERE pv_p.producto_id = p.id AND pv_p.activo = TRUE
        AND (p.precio_base + COALESCE(pv_p.precio_adicional,0)) >= ${idx()}
    )`);
  }
  if (precio_max !== null && precio_max !== '') {
    params.push(parseFloat(precio_max));
    where.push(`EXISTS (
      SELECT 1 FROM productos.producto_variantes pv_p
      WHERE pv_p.producto_id = p.id AND pv_p.activo = TRUE
        AND (p.precio_base + COALESCE(pv_p.precio_adicional,0)) <= ${idx()}
    )`);
  }

  // Filtro por atributos: AND entre tipos, OR entre valores del mismo tipo
  for (const [tipoKey, valArr] of Object.entries(atributos)) {
    const tipoId = parseInt(tipoKey);
    const valIds = (Array.isArray(valArr) ? valArr : []).map(Number).filter(Boolean);
    if (!valIds.length) continue;
    params.push(tipoId); const ti = params.length;
    params.push(valIds); const vi = params.length;
    where.push(`EXISTS (
      SELECT 1 FROM productos.producto_variantes pv_a
      INNER JOIN productos.variante_atributos va_a ON va_a.variante_id = pv_a.id
      WHERE pv_a.producto_id = p.id AND pv_a.activo = TRUE
        AND va_a.tipo_atributo_id  = $${ti}
        AND va_a.valor_atributo_id = ANY($${vi})
    )`);
  }

  const whereSQL = where.join(' AND ');
  const ordenMap = {
    // precio_min ya viene calculado como subquery en el SELECT, ordenamos por él
    precio_asc:  '(SELECT MIN(p_o.precio_base + COALESCE(pv_o.precio_adicional,0)) FROM productos.producto_variantes pv_o INNER JOIN productos.productos p_o ON p_o.id = pv_o.producto_id WHERE pv_o.producto_id=p.id AND pv_o.activo=TRUE) ASC NULLS LAST',
    precio_desc: '(SELECT MIN(p_o.precio_base + COALESCE(pv_o.precio_adicional,0)) FROM productos.producto_variantes pv_o INNER JOIN productos.productos p_o ON p_o.id = pv_o.producto_id WHERE pv_o.producto_id=p.id AND pv_o.activo=TRUE) DESC NULLS LAST',
    nombre_asc:  'p.nombre ASC',
    reciente:    'p.fecha_creacion DESC',
  };
  const orderSQL = ordenMap[orden] || ordenMap.reciente;
  const limit    = Math.max(1, parseInt(por_pagina) || 12);
  const offset   = (Math.max(1, parseInt(pagina)) - 1) * limit;

  params.push(limit);  const li = params.length;
  params.push(offset); const oi = params.length;

  const sql = `
    SELECT
      p.id,
      p.nombre,
      p.descripcion,
      p.precio_base,
      p.fecha_creacion,
      c.id     AS categoria_id,
      c.nombre AS categoria_nombre,
      s.nombre AS subcategoria_nombre,
      m.nombre AS marca_nombre,
      mat.nombre AS material_nombre,

      -- Imagen: primera variante activa con imagen
      (SELECT pv1.imagen_url
       FROM productos.producto_variantes pv1
       WHERE pv1.producto_id = p.id AND pv1.activo = TRUE AND pv1.imagen_url IS NOT NULL
       ORDER BY pv1.id LIMIT 1
      ) AS imagen_url,

      -- Precio mínimo y máximo entre todas las variantes
      (SELECT MIN(p2.precio_base + COALESCE(pv2.precio_adicional,0))
       FROM productos.producto_variantes pv2
       INNER JOIN productos.productos p2 ON p2.id = pv2.producto_id
       WHERE pv2.producto_id = p.id AND pv2.activo = TRUE
      )::numeric AS precio_min,

      (SELECT MAX(p3.precio_base + COALESCE(pv3.precio_adicional,0))
       FROM productos.producto_variantes pv3
       INNER JOIN productos.productos p3 ON p3.id = pv3.producto_id
       WHERE pv3.producto_id = p.id AND pv3.activo = TRUE
      )::numeric AS precio_max,

      -- Total de variantes activas
      (SELECT COUNT(*) FROM productos.producto_variantes pv4
       WHERE pv4.producto_id = p.id AND pv4.activo = TRUE
      ) AS num_variantes,

      -- Colores disponibles (array de objetos {id, nombre, imagen_url})
      (SELECT json_agg(DISTINCT jsonb_build_object(
          'id',     col.id,
          'nombre', col.nombre,
          'imagen', (SELECT pvc.imagen_url FROM productos.producto_variantes pvc
                     WHERE pvc.producto_id = p.id AND pvc.color_id = col.id
                       AND pvc.activo = TRUE AND pvc.imagen_url IS NOT NULL
                     ORDER BY pvc.id LIMIT 1)
        ))
       FROM productos.producto_variantes pvc2
       INNER JOIN productos.colores col ON col.id = pvc2.color_id
       WHERE pvc2.producto_id = p.id AND pvc2.activo = TRUE AND pvc2.color_id IS NOT NULL
      ) AS colores,

      -- Atributos disponibles agrupados por tipo
      (SELECT json_agg(DISTINCT jsonb_build_object(
          'tipo_id',     ta.id,
          'tipo_nombre', ta.nombre,
          'valor_id',    va_v.id,
          'valor',       va_v.valor
        ) ORDER BY jsonb_build_object(
          'tipo_id',     ta.id,
          'tipo_nombre', ta.nombre,
          'valor_id',    va_v.id,
          'valor',       va_v.valor
        ))
       FROM productos.producto_variantes pva
       INNER JOIN productos.variante_atributos va ON va.variante_id = pva.id
       INNER JOIN productos.tipos_atributo ta     ON ta.id = va.tipo_atributo_id
       INNER JOIN productos.valores_atributo va_v ON va_v.id = va.valor_atributo_id
       WHERE pva.producto_id = p.id AND pva.activo = TRUE AND ta.activo = TRUE
      ) AS atributos

    FROM productos.productos p
    LEFT JOIN productos.categorias    c   ON c.id   = p.categoria_id
    LEFT JOIN productos.subcategorias s   ON s.id   = p.subcategoria_id
    LEFT JOIN productos.marcas        m   ON m.id   = p.marca_id
    LEFT JOIN productos.materiales    mat ON mat.id = p.material_id
    WHERE ${whereSQL}
    ORDER BY ${orderSQL}
    LIMIT $${li} OFFSET $${oi}
  `;

  const countSQL = `
    SELECT COUNT(DISTINCT p.id) AS total
    FROM productos.productos p
    WHERE ${whereSQL}
  `;
  const countParams = params.slice(0, params.length - 2);

  const [rows, cnt] = await Promise.all([
    db.query(sql, params),
    db.query(countSQL, countParams),
  ]);

  const total = parseInt(cnt.rows[0].total);
  return {
    productos:     rows.rows,
    total,
    pagina:        parseInt(pagina),
    por_pagina:    limit,
    total_paginas: Math.ceil(total / limit),
  };
};

// ═══════════════════════════════════════════
// 4. DETALLE COMPLETO DE UN PRODUCTO
// ═══════════════════════════════════════════
const obtenerDetalle = async (id) => {
  const prodR = await db.query(`
    SELECT p.id, p.nombre, p.descripcion, p.precio_base,
      c.id AS categoria_id, c.nombre AS categoria_nombre,
      s.nombre AS subcategoria_nombre,
      m.nombre AS marca_nombre, mat.nombre AS material_nombre
    FROM productos.productos p
    LEFT JOIN productos.categorias    c   ON c.id   = p.categoria_id
    LEFT JOIN productos.subcategorias s   ON s.id   = p.subcategoria_id
    LEFT JOIN productos.marcas        m   ON m.id   = p.marca_id
    LEFT JOIN productos.materiales    mat ON mat.id = p.material_id
    WHERE p.id = $1 AND p.activo = TRUE
  `, [id]);

  if (!prodR.rowCount) return null;
  const prod = prodR.rows[0];

  // Variantes con atributos (tu query exacta)
  const varR = await db.query(`
    SELECT
      pv.id AS variante_id,
      pv.sku,
      pv.precio_adicional,
      pv.imagen_url,
      col.id   AS color_id,
      col.nombre AS color,
      (p.precio_base + COALESCE(pv.precio_adicional,0)) AS precio_final,
      COALESCE(i.cantidad_disponible, 0) AS stock,
      json_agg(
        json_build_object('tipo_id', ta.id, 'tipo', ta.nombre, 'valor_id', va_v.id, 'valor', va_v.valor)
        ORDER BY ta.nombre, va_v.valor
      ) FILTER (WHERE va_v.id IS NOT NULL) AS atributos
    FROM productos.producto_variantes pv
    INNER JOIN productos.productos p ON p.id = pv.producto_id
    LEFT JOIN productos.colores col         ON col.id = pv.color_id
    LEFT JOIN public.inventario i           ON i.variante_id = pv.id
    LEFT JOIN productos.variante_atributos va ON va.variante_id = pv.id
    LEFT JOIN productos.tipos_atributo ta   ON ta.id = va.tipo_atributo_id
    LEFT JOIN productos.valores_atributo va_v ON va_v.id = va.valor_atributo_id
    WHERE pv.producto_id = $1 AND pv.activo = TRUE
    GROUP BY pv.id, pv.sku, pv.precio_adicional, pv.imagen_url,
      col.id, col.nombre, i.cantidad_disponible, p.precio_base
    ORDER BY col.nombre, pv.id
  `, [id]);

  prod.imagen_url = varR.rows.find(v => v.imagen_url)?.imagen_url || null;
  prod.variantes  = varR.rows;

  // Colores únicos
  prod.colores = [...new Map(
    varR.rows.filter(v => v.color_id).map(v => [v.color_id, { id: v.color_id, nombre: v.color,
      imagen: varR.rows.find(x => x.color_id === v.color_id && x.imagen_url)?.imagen_url || null }])
  ).values()];

  // Tipos de atributo únicos para los selectores
  const tiposMap = {};
  varR.rows.forEach(v => {
    (v.atributos || []).forEach(a => {
      if (!tiposMap[a.tipo_id]) tiposMap[a.tipo_id] = { id: a.tipo_id, nombre: a.tipo, valores: [] };
      if (!tiposMap[a.tipo_id].valores.find(x => x.id === a.valor_id))
        tiposMap[a.tipo_id].valores.push({ id: a.valor_id, valor: a.valor });
    });
  });
  prod.tipos_atributo = Object.values(tiposMap);

  return prod;
};

module.exports = { obtenerCategorias, obtenerFiltros, listarProductos, obtenerDetalle };