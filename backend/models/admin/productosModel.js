const db = require('../../config/db');

// ─── CATÁLOGOS AUXILIARES ─────────────────────────────────

const obtenerColores = async () => {
  const r = await db.query('SELECT * FROM productos.colores ORDER BY nombre');
  return r.rows;
};

const obtenerMateriales = async () => {
  const r = await db.query('SELECT * FROM productos.materiales ORDER BY nombre');
  return r.rows;
};

const obtenerTiposAtributo = async () => {
  const tipos = await db.query(
    'SELECT * FROM productos.tipos_atributo WHERE activo = true ORDER BY id'
  );

  const valores = await db.query(
    'SELECT * FROM productos.valores_atributo WHERE activo = true ORDER BY tipo_atributo_id, valor'
  );

  return tipos.rows.map(tipo => ({
    ...tipo,
    valores: valores.rows.filter(v => v.tipo_atributo_id === tipo.id)
  }));
};

// ─── PRODUCTOS ────────────────────────────────────────────

const obtenerProductos = async () => {
  const result = await db.query(`
    SELECT p.id, p.nombre, p.descripcion, p.precio_base, p.activo, p.fecha_creacion,
           c.nombre  AS categoria_nombre,
           sc.nombre AS subcategoria_nombre,
           m.nombre  AS marca_nombre,
           mat.nombre AS material_nombre,
           COUNT(DISTINCT pv.id) AS num_variantes,
           COALESCE(SUM(i.cantidad_disponible), 0) AS stock_total
    FROM productos.productos p
    LEFT JOIN productos.categorias    c   ON p.categoria_id    = c.id
    LEFT JOIN productos.subcategorias sc  ON p.subcategoria_id = sc.id
    LEFT JOIN productos.marcas        m   ON p.marca_id        = m.id
    LEFT JOIN productos.materiales    mat ON p.material_id     = mat.id
    LEFT JOIN productos.producto_variantes pv ON p.id = pv.producto_id AND pv.activo = true
    LEFT JOIN inventario.inventario   i   ON pv.id = i.variante_id
    GROUP BY p.id, c.nombre, sc.nombre, m.nombre, mat.nombre
    ORDER BY p.id ASC
  `);

  return result.rows;
};

const obtenerProductoDetalle = async (id) => {

  const prod = await db.query(`
    SELECT p.*, 
           c.nombre AS categoria_nombre, 
           sc.nombre AS subcategoria_nombre,
           m.nombre AS marca_nombre, 
           mat.nombre AS material_nombre
    FROM productos.productos p
    LEFT JOIN productos.categorias c ON p.categoria_id = c.id
    LEFT JOIN productos.subcategorias sc ON p.subcategoria_id = sc.id
    LEFT JOIN productos.marcas m ON p.marca_id = m.id
    LEFT JOIN productos.materiales mat ON p.material_id = mat.id
    WHERE p.id = $1
  `, [id]);

  if (prod.rowCount === 0) throw new Error('Producto no encontrado');

  const atributos = await db.query(`
    SELECT pta.tipo_atributo_id, ta.nombre AS tipo_nombre
    FROM productos.producto_tipos_atributo pta
    JOIN productos.tipos_atributo ta ON pta.tipo_atributo_id = ta.id
    WHERE pta.producto_id = $1
  `, [id]);

  const variantes = await db.query(`
    SELECT pv.id, pv.sku, pv.precio_adicional, pv.activo,
           c.id AS color_id, c.nombre AS color_nombre,
           i.cantidad_disponible AS stock, 
           i.cantidad_minima AS stock_minimo
    FROM productos.producto_variantes pv
    LEFT JOIN productos.colores c ON pv.color_id = c.id
    LEFT JOIN inventario.inventario i ON pv.id = i.variante_id
    WHERE pv.producto_id = $1
    ORDER BY pv.id
  `, [id]);

  for (const v of variantes.rows) {

    const attrs = await db.query(`
      SELECT va.tipo_atributo_id, 
             ta.nombre AS tipo_nombre,
             va.valor_atributo_id, 
             vatr.valor AS valor_nombre
      FROM productos.variante_atributos va
      JOIN productos.tipos_atributo ta ON va.tipo_atributo_id = ta.id
      JOIN productos.valores_atributo vatr ON va.valor_atributo_id = vatr.id
      WHERE va.variante_id = $1
    `, [v.id]);

    v.atributos = attrs.rows;
  }

  return {
    ...prod.rows[0],
    atributos_producto: atributos.rows,
    variantes: variantes.rows
  };
};

// ─── CREAR PRODUCTO COMPLETO ──────────────────────────────

const crearProductoCompleto = async ({ producto, tiposAtributo, variantes }) => {

  const client = await db.connect();

  try {

    await client.query('BEGIN');

    const prodResult = await client.query(`
      INSERT INTO productos.productos 
      (nombre, descripcion, precio_base, categoria_id, subcategoria_id, marca_id, material_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
    `, [
      producto.nombre,
      producto.descripcion || null,
      producto.precio_base,
      producto.categoria_id,
      producto.subcategoria_id || null,
      producto.marca_id || null,
      producto.material_id || null
    ]);

    const productoId = prodResult.rows[0].id;

    for (const tipoId of (tiposAtributo || [])) {
      await client.query(
        'INSERT INTO productos.producto_tipos_atributo (producto_id, tipo_atributo_id) VALUES ($1,$2)',
        [productoId, tipoId]
      );
    }

    for (const v of (variantes || [])) {

      const varResult = await client.query(`
        INSERT INTO productos.producto_variantes (producto_id, color_id, sku, precio_adicional)
        VALUES ($1,$2,$3,$4)
        RETURNING id
      `, [
        productoId, 
        v.color_id || null, 
        v.sku, 
        v.precio_adicional || 0
      ]);

      const varianteId = varResult.rows[0].id;

      for (const attr of (v.atributos || [])) {
        await client.query(
          'INSERT INTO productos.variante_atributos (variante_id, tipo_atributo_id, valor_atributo_id) VALUES ($1,$2,$3)',
          [varianteId, attr.tipo_atributo_id, attr.valor_atributo_id]
        );
      }

      await client.query(
        'INSERT INTO inventario.inventario (variante_id, cantidad_disponible, cantidad_minima) VALUES ($1,$2,$3)',
        [varianteId, v.stock || 0, v.stock_minimo || 5]
      );
    }

    await client.query('COMMIT');

    return { id: productoId };

  } catch (err) {

    await client.query('ROLLBACK');
    throw err;

  } finally {

    client.release();

  }
};

// ─── ACTUALIZAR PRODUCTO ──────────────────────────────────

const actualizarProducto = async (id, data) => {

  const {
    nombre,
    descripcion,
    precio_base,
    categoria_id,
    subcategoria_id,
    marca_id,
    material_id
  } = data;

  const result = await db.query(`
    UPDATE productos.productos SET
      nombre = $1,
      descripcion = $2,
      precio_base = $3,
      categoria_id = $4,
      subcategoria_id = $5,
      marca_id = $6,
      material_id = $7
    WHERE id = $8
    RETURNING *
  `, [
    nombre,
    descripcion || null,
    precio_base,
    categoria_id,
    subcategoria_id || null,
    marca_id || null,
    material_id || null,
    id
  ]);

  if (result.rowCount === 0) throw new Error('Producto no encontrado');

  return result.rows[0];
};

// ─── ELIMINAR PRODUCTO ────────────────────────────────────

const eliminarProducto = async (id) => {

  const prod = await db.query(
    'SELECT id FROM productos.productos WHERE id = $1',
    [id]
  );

  if (prod.rowCount === 0) throw new Error('Producto no encontrado');

  await db.query(
    'DELETE FROM productos.productos WHERE id = $1',
    [id]
  );

  return {
    mensaje: 'Producto eliminado'
  };

};

module.exports = {
  obtenerColores,
  obtenerMateriales,
  obtenerTiposAtributo,
  obtenerProductos,
  obtenerProductoDetalle,
  crearProductoCompleto,
  actualizarProducto,
  eliminarProducto
};