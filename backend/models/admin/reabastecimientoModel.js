// backend/models/admin/reabastecimientoModel.js
const pool = require('../../config/db');

// ─── PRODUCTOS FILTRADOS ──────────────────────────────────────────────────────
const getProductosFiltrados = async ({ categoria_id, subcategoria_id, search }) => {
  const conditions = ['p.activo = TRUE'];
  const values = [];
  let idx = 1;

  if (categoria_id) { conditions.push(`p.categoria_id = $${idx++}`); values.push(categoria_id); }
  if (subcategoria_id) { conditions.push(`p.subcategoria_id = $${idx++}`); values.push(subcategoria_id); }
  if (search && search.trim() !== "") {
    conditions.push(`(p.nombre ILIKE $${idx} OR m.nombre ILIKE $${idx})`);
    values.push(`%${search.trim()}%`); idx++;
  }

  const query = `
    SELECT
      p.id AS producto_id, p.nombre AS producto_nombre, p.descripcion, p.precio_base,
      c.id AS categoria_id, c.nombre AS categoria,
      s.id AS subcategoria_id, s.nombre AS subcategoria,
      m.nombre AS marca,
      (SELECT pv2.imagen_url FROM productos.producto_variantes pv2
       WHERE pv2.producto_id = p.id AND pv2.activo = TRUE ORDER BY pv2.id LIMIT 1) AS imagen_url,
      COUNT(pv.id) AS total_variantes,
      COALESCE(SUM(i.cantidad), 0) AS stock_total,
      COALESCE(SUM(i.cantidad_minima), 0) AS stock_minimo_total
    FROM productos.productos p
    LEFT JOIN productos.categorias c ON p.categoria_id = c.id
    LEFT JOIN productos.subcategorias s ON p.subcategoria_id = s.id
    LEFT JOIN productos.marcas m ON p.marca_id = m.id
    LEFT JOIN productos.producto_variantes pv ON pv.producto_id = p.id AND pv.activo = TRUE
    LEFT JOIN inventario.inventario i ON i.variante_id = pv.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id, c.id, c.nombre, s.id, s.nombre, m.nombre
    ORDER BY p.fecha_creacion DESC;
  `;
  const { rows } = await pool.query(query, values);
  return rows;
};

// ─── VARIANTES DE UN PRODUCTO ─────────────────────────
const getVariantesByProducto = async (producto_id) => {
  const query = `
    SELECT
      pv.id AS variante_id, p.nombre AS producto,
      pct.nombre AS categoria, ps.nombre AS subcategoria,
      pc.nombre AS color, pv.imagen_url, pv.precio_adicional,
      COALESCE(i.cantidad, 0) AS cantidad_disponible,
      COALESCE(i.cantidad_minima, 0) AS cantidad_minima,
      STRING_AGG(CONCAT(ta.nombre, ': ', vaa.valor), ', ' ORDER BY ta.nombre) AS descripcion
    FROM productos.productos p
    JOIN productos.producto_variantes pv ON pv.producto_id = p.id
    JOIN productos.colores pc ON pc.id = pv.color_id
    JOIN productos.categorias pct ON pct.id = p.categoria_id
    JOIN productos.subcategorias ps ON ps.id = p.subcategoria_id
    JOIN productos.variante_atributos va ON va.variante_id = pv.id
    JOIN productos.tipos_atributo ta ON ta.id = va.tipo_atributo_id
    JOIN productos.valores_atributo vaa ON vaa.id = va.valor_atributo_id
    LEFT JOIN inventario.inventario i ON i.variante_id = pv.id
    WHERE p.id = $1 AND pv.activo = TRUE
    GROUP BY p.id, pv.id, pc.nombre, pct.nombre, ps.nombre, i.cantidad, i.cantidad_minima
    ORDER BY pv.id;
  `;
  const { rows } = await pool.query(query, [producto_id]);
  return rows;
};

// ─── VENTAS DE UN PRODUCTO ────────────────────────────────────────────────────
const getVentasByProducto = async (producto_id, periodo = 'mes') => {
  const intervalMap = { dia: "INTERVAL '1 day'", semana: "INTERVAL '7 days'", mes: "INTERVAL '30 days'", todo: null };
  const interval = intervalMap[periodo] ?? intervalMap['mes'];
  const fechaCondicion = interval ? `AND v.fecha_venta >= NOW() - ${interval}` : '';

  const queryDetalle = `
    SELECT v.fecha_venta::DATE AS fecha, p.nombre AS producto, pc.nombre AS color,
      pv.imagen_url,   -- ← agregamos la imagen de la variante
      STRING_AGG(CONCAT(ta.nombre, ': ', vaa.valor), ', ' ORDER BY ta.nombre) AS atributos,
      vd.cantidad AS cantidad_vendida
    FROM inventario.ventas v
    JOIN inventario.ventas_detalle vd ON vd.venta_id = v.id
    JOIN productos.producto_variantes pv ON pv.id = vd.variante_id
    JOIN productos.productos p ON p.id = pv.producto_id
    JOIN productos.colores pc ON pc.id = pv.color_id
    LEFT JOIN productos.variante_atributos va ON va.variante_id = pv.id
    LEFT JOIN productos.tipos_atributo ta ON ta.id = va.tipo_atributo_id
    LEFT JOIN productos.valores_atributo vaa ON vaa.id = va.valor_atributo_id
    WHERE p.id = $1 ${fechaCondicion}
    GROUP BY v.fecha_venta::DATE, p.nombre, pc.nombre, pv.imagen_url, vd.cantidad
    ORDER BY v.fecha_venta::DATE DESC;
`;
  const querySerie = `
    SELECT v.fecha_venta::DATE AS fecha, SUM(vd.cantidad) AS total_vendido
    FROM inventario.ventas v
    JOIN inventario.ventas_detalle vd ON vd.venta_id = v.id
    JOIN productos.producto_variantes pv ON pv.id = vd.variante_id
    JOIN productos.productos p ON p.id = pv.producto_id
    WHERE p.id = $1 ${fechaCondicion}
    GROUP BY v.fecha_venta::DATE ORDER BY v.fecha_venta::DATE ASC;
  `;
  const queryPorVariante = `
    SELECT pv.id AS variante_id, pc.nombre AS color,
      STRING_AGG(CONCAT(ta.nombre, ': ', vaa.valor), ', ' ORDER BY ta.nombre) AS descripcion,
      SUM(vd.cantidad) AS total_vendido
    FROM inventario.ventas v
    JOIN inventario.ventas_detalle vd ON vd.venta_id = v.id
    JOIN productos.producto_variantes pv ON pv.id = vd.variante_id
    JOIN productos.productos p ON p.id = pv.producto_id
    JOIN productos.colores pc ON pc.id = pv.color_id
    LEFT JOIN productos.variante_atributos va ON va.variante_id = pv.id
    LEFT JOIN productos.tipos_atributo ta ON ta.id = va.tipo_atributo_id
    LEFT JOIN productos.valores_atributo vaa ON vaa.id = va.valor_atributo_id
    WHERE p.id = $1 ${fechaCondicion}
    GROUP BY pv.id, pc.nombre ORDER BY total_vendido DESC;
  `;
  const [detalle, serie, porVariante] = await Promise.all([
    pool.query(queryDetalle, [producto_id]),
    pool.query(querySerie, [producto_id]),
    pool.query(queryPorVariante, [producto_id]),
  ]);
  return { detalle: detalle.rows, serie: serie.rows, porVariante: porVariante.rows };
};

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────
const getCategorias = async () => {
  const { rows } = await pool.query(`
    SELECT DISTINCT c.id, c.nombre FROM productos.categorias c
    INNER JOIN productos.productos p ON p.categoria_id = c.id
    WHERE p.activo = TRUE ORDER BY c.nombre;
  `);
  return rows;
};

// ─── SUBCATEGORIAS ────────────────────────────────────────────────────────────
const getSubcategorias = async (categoria_id) => {
  const base = `SELECT DISTINCT s.id, s.nombre FROM productos.subcategorias s
    INNER JOIN productos.productos p ON p.subcategoria_id = s.id WHERE p.activo = TRUE`;
  const { rows } = categoria_id
    ? await pool.query(`${base} AND p.categoria_id = $1 ORDER BY s.nombre;`, [categoria_id])
    : await pool.query(`${base} ORDER BY s.nombre;`);
  return rows;
};

// ─── PREDICCION INDIVIDUAL ────────────────────────────────────────────────────
const getPrediccion = async (producto_id, periodo = 'mes') => {
  const intervalMap = { dia: "INTERVAL '1 day'", semana: "INTERVAL '7 days'", mes: "INTERVAL '30 days'", todo: null };
  const interval = intervalMap[periodo] ?? intervalMap['mes'];
  const fechaCondicion = interval ? `AND v.fecha_venta >= NOW() - ${interval}` : '';

  const stockRes = await pool.query(`
    SELECT COALESCE(SUM(i.cantidad), 0) AS stock_total
    FROM productos.productos p
    JOIN productos.producto_variantes pv ON pv.producto_id = p.id AND pv.activo = TRUE
    LEFT JOIN inventario.inventario i ON i.variante_id = pv.id
    WHERE p.id = $1
  `, [producto_id]);

  const ventasRes = await pool.query(`
    SELECT COALESCE(SUM(vd.cantidad), 0) AS total_vendido,
      COUNT(DISTINCT v.fecha_venta::DATE) AS dias_con_ventas,
      COALESCE(MAX(vd.cantidad), 0) AS max_diario
    FROM inventario.ventas v
    JOIN inventario.ventas_detalle vd ON vd.venta_id = v.id
    JOIN productos.producto_variantes pv ON pv.id = vd.variante_id
    JOIN productos.productos p ON p.id = pv.producto_id
    WHERE p.id = $1 ${fechaCondicion}
  `, [producto_id]);

  const stockTotal     = parseInt(stockRes.rows[0]?.stock_total || 0, 10);
  const totalVendido   = parseInt(ventasRes.rows[0].total_vendido,    10);
  const diasConVentas  = parseInt(ventasRes.rows[0].dias_con_ventas,  10);
  const maxDiario      = parseInt(ventasRes.rows[0].max_diario,       10);
  const promedioDiario = diasConVentas > 0 ? totalVendido / diasConVentas : 0;

  return {
    stock_actual:            stockTotal,
    ventas_totales_periodo:  totalVendido,
    dias_con_ventas:         diasConVentas,
    ventas_promedio_diarias: parseFloat(promedioDiario.toFixed(2)),
    demanda_maxima_diaria:   maxDiario,
    tiempo_entrega_dias:     7,
  };
};

// ─── PREDICCION GENERAL ───────────────────────────────────────────────────────
// Usa la consulta verificada por el usuario como base.
//
// Modelo:  dx/dt = kx  =>  x(t) = x0 * e^(k*t)
//   k      = ln(1 - d/x0)      d = promedio ventas diarias (30 dias)
//   t_ROP  = ln(ROP/x0) / k   dias hasta llegar al punto de reorden
//   ROP    = i.cantidad_minima  definido por el administrador
//
// Estado:
//   critico    => stock_actual <= ROP   (ya alcanzo o supero el punto de reorden)
//   proximo    => dias_hasta_rop <= 14  (llegara al ROP en <= 14 dias)
//   abastecido => resto
// ─────────────────────────────────────────────────────────────────────────────
const getPrediccionGeneral = async () => {

  // Query 1: tu consulta verificada + p.id y pv.imagen_url
  const variantesQuery = `
    SELECT
      pv.id                              AS variante_id,
      p.id                               AS producto_id,
      p.nombre                           AS producto_nombre,
      pct.nombre                         AS categoria,
      ps.nombre                          AS subcategoria,
      pc.nombre                          AS color,
      COALESCE(i.cantidad, 0)            AS cantidad_disponible,
      COALESCE(i.cantidad_minima, 0)     AS cantidad_minima,
      pv.imagen_url,
      STRING_AGG(
        CONCAT(ta.nombre, ': ', vaa.valor),
        ', ' ORDER BY ta.nombre
      )                                  AS descripcion
    FROM productos.productos p
    JOIN productos.producto_variantes  pv  ON pv.producto_id = p.id
    JOIN productos.colores             pc  ON pc.id          = pv.color_id
    JOIN productos.categorias          pct ON pct.id         = p.categoria_id
    JOIN productos.subcategorias       ps  ON ps.id          = p.subcategoria_id
    JOIN productos.variante_atributos  va  ON va.variante_id = pv.id
    JOIN productos.tipos_atributo      ta  ON ta.id          = va.tipo_atributo_id
    JOIN productos.valores_atributo    vaa ON vaa.id         = va.valor_atributo_id
    LEFT JOIN inventario.inventario    i   ON i.variante_id  = pv.id
    WHERE p.activo = TRUE
      AND pv.activo = TRUE
    GROUP BY
      p.id, pv.id, pc.nombre, pct.nombre, ps.nombre,
      i.cantidad, i.cantidad_minima, pv.imagen_url
    ORDER BY p.nombre, pv.id;
  `;

  // Query 2: ventas por variante (ultimos 30 dias)
  const ventasQuery = `
    SELECT
      vd.variante_id,
      SUM(vd.cantidad)                    AS total_vendido,
      COUNT(DISTINCT v.fecha_venta::DATE) AS dias_con_ventas
    FROM inventario.ventas_detalle vd
    JOIN inventario.ventas v ON v.id = vd.venta_id
    WHERE v.fecha_venta >= NOW() - INTERVAL '30 days'
    GROUP BY vd.variante_id;
  `;

  const [varRes, ventRes] = await Promise.all([
    pool.query(variantesQuery),
    pool.query(ventasQuery),
  ]);

  // Indice rapido por variante_id
  const ventasPorVariante = {};
  for (const row of ventRes.rows) {
    ventasPorVariante[row.variante_id] = {
      total_vendido:   parseInt(row.total_vendido,   10),
      dias_con_ventas: parseInt(row.dias_con_ventas, 10),
    };
  }

  // Calculo exponencial por variante
  const resultado = varRes.rows.map((v) => {
    const x0  = parseInt(v.cantidad_disponible, 10);  // stock actual
    const rop = parseInt(v.cantidad_minima,     10);  // ROP del admin

    const venta         = ventasPorVariante[v.variante_id];
    const totalVendido  = venta?.total_vendido   ?? 0;
    const diasConVentas = venta?.dias_con_ventas ?? 0;

    // d = promedio diario de ventas
    const d = diasConVentas > 0
      ? parseFloat((totalVendido / diasConVentas).toFixed(4))
      : 0;

    // k = ln(1 - d/x0)  valido solo cuando x0 > d > 0
    let k            = null;
    let diasHastaRop = null;

    if (d > 0 && x0 > d) {
      k = parseFloat(Math.log(1 - d / x0).toFixed(6));

      // t_ROP = ln(ROP/x0) / k  valido cuando 0 < ROP < x0
      if (rop > 0 && rop < x0) {
        diasHastaRop = parseFloat((Math.log(rop / x0) / k).toFixed(2));
      }
    }

    /// Clasificación de estado con rangos personalizados
    let estado;
    if (x0 <= rop) {
      estado = 'critico';
    } else if (diasHastaRop !== null && diasHastaRop <= 3) {
      estado = 'critico';        // 1 a 3 días → crítico
    } else if (diasHastaRop !== null && diasHastaRop <= 7) {
      estado = 'proximo';        // 4 a 7 días → próximo
    } else {
      estado = 'abastecido';     // más de 7 días, null o infinito
    }

    return {
      variante_id:     v.variante_id,
      producto_id:     v.producto_id,
      producto_nombre: v.producto_nombre,
      categoria:       v.categoria,
      subcategoria:    v.subcategoria,
      color:           v.color,
      atributos:       v.descripcion,
      imagen_url:      v.imagen_url,
      stock_actual:    x0,
      rop,
      promedio_diario: d,
      k,
      dias_hasta_rop:  diasHastaRop,
      estado,
    };
  });

  return resultado;
};

// ─── REABASTECIMIENTO  ────────────────────────

const getVentasByVariante = async (variante_id) => {
  const query = `
    SELECT
      v.fecha_venta::DATE             AS fecha,
      SUM(vd.cantidad)                AS cantidad_vendida
    FROM inventario.ventas v
    JOIN inventario.ventas_detalle vd ON vd.venta_id = v.id
    WHERE vd.variante_id = $1
      AND v.fecha_venta >= NOW() - INTERVAL '30 days'
    GROUP BY v.fecha_venta::DATE
    ORDER BY v.fecha_venta::DATE DESC;
  `;
  const { rows } = await pool.query(query, [variante_id]);
  return rows;
};


module.exports = {
  getProductosFiltrados,
  getVariantesByProducto,
  getVentasByProducto,
  getCategorias,
  getSubcategorias,
  getPrediccion,
  getPrediccionGeneral,
  getVentasByVariante,
};