const db = require('../../config/db');

// ─── CATÁLOGOS AUXILIARES ─────────────────────────────────

const obtenerColores = async () => {
  const r = await db.query('SELECT * FROM colores ORDER BY nombre');
  return r.rows;
};

const obtenerMateriales = async () => {
  const r = await db.query('SELECT * FROM materiales ORDER BY nombre');
  return r.rows;
};

const obtenerTiposAtributo = async () => {
  const tipos = await db.query('SELECT * FROM tipos_atributo WHERE activo = true ORDER BY id');
  const valores = await db.query('SELECT * FROM valores_atributo WHERE activo = true ORDER BY tipo_atributo_id, valor');
  
  return tipos.rows.map(tipo => ({
    ...tipo,
    valores: valores.rows.filter(v => v.tipo_atributo_id === tipo.id)
  }));
};

// ─── PRODUCTOS ────────────────────────────────────────────

const obtenerProductos = async () => {
  const result = await db.query(`
    SELECT p.id, p.nombre, p.descripcion, p.precio_base, p.imagen_url, p.activo, p.fecha_creacion,
           c.nombre  AS categoria_nombre,
           sc.nombre AS subcategoria_nombre,
           m.nombre  AS marca_nombre,
           mat.nombre AS material_nombre,
           COUNT(DISTINCT pv.id) AS num_variantes,
           COALESCE(SUM(i.cantidad_disponible), 0) AS stock_total
    FROM productos p
    LEFT JOIN categorias    c   ON p.categoria_id    = c.id
    LEFT JOIN subcategorias sc  ON p.subcategoria_id = sc.id
    LEFT JOIN marcas        m   ON p.marca_id        = m.id
    LEFT JOIN materiales    mat ON p.material_id     = mat.id
    LEFT JOIN producto_variantes pv ON p.id = pv.producto_id AND pv.activo = true
    LEFT JOIN inventario    i   ON pv.id = i.variante_id
    GROUP BY p.id, c.nombre, sc.nombre, m.nombre, mat.nombre
    ORDER BY p.id ASC
  `);
  return result.rows;
};

const obtenerProductoDetalle = async (id) => {
  // Producto base
  const prod = await db.query(`
    SELECT p.*, c.nombre AS categoria_nombre, sc.nombre AS subcategoria_nombre,
           m.nombre AS marca_nombre, mat.nombre AS material_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN subcategorias sc ON p.subcategoria_id = sc.id
    LEFT JOIN marcas m ON p.marca_id = m.id
    LEFT JOIN materiales mat ON p.material_id = mat.id
    WHERE p.id = $1
  `, [id]);
  if (prod.rowCount === 0) throw new Error('Producto no encontrado');

  // Atributos del producto
  const atributos = await db.query(`
    SELECT pta.tipo_atributo_id, ta.nombre AS tipo_nombre
    FROM producto_tipos_atributo pta
    JOIN tipos_atributo ta ON pta.tipo_atributo_id = ta.id
    WHERE pta.producto_id = $1
  `, [id]);

  // Variantes con sus atributos e inventario
  const variantes = await db.query(`
    SELECT pv.id, pv.sku, pv.precio_adicional, pv.imagen_url, pv.activo,
           c.id AS color_id, c.nombre AS color_nombre,
           i.cantidad_disponible AS stock, i.cantidad_minima AS stock_minimo
    FROM producto_variantes pv
    LEFT JOIN colores c ON pv.color_id = c.id
    LEFT JOIN inventario i ON pv.id = i.variante_id
    WHERE pv.producto_id = $1
    ORDER BY pv.id
  `, [id]);

  // Atributos de cada variante
  for (const v of variantes.rows) {
    const attrs = await db.query(`
      SELECT va.tipo_atributo_id, ta.nombre AS tipo_nombre,
             va.valor_atributo_id, vatr.valor AS valor_nombre
      FROM variante_atributos va
      JOIN tipos_atributo ta ON va.tipo_atributo_id = ta.id
      JOIN valores_atributo vatr ON va.valor_atributo_id = vatr.id
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

// ─── CREAR PRODUCTO COMPLETO (con transacción) ────────────
const crearProductoCompleto = async ({ producto, tiposAtributo, variantes, imagen_url }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar producto base
    const prodResult = await client.query(`
      INSERT INTO productos 
      (nombre, descripcion, precio_base, categoria_id, subcategoria_id, marca_id, material_id, imagen_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `, [
      producto.nombre, producto.descripcion || null, producto.precio_base,
      producto.categoria_id, producto.subcategoria_id || null,
      producto.marca_id || null, producto.material_id || null, imagen_url || null
    ]);
    const productoId = prodResult.rows[0].id;

    // 2. Registrar qué tipos de atributo usa este producto
    for (const tipoId of (tiposAtributo || [])) {
      await client.query(
        'INSERT INTO producto_tipos_atributo (producto_id, tipo_atributo_id) VALUES ($1,$2)',
        [productoId, tipoId]
      );
    }

    // 3. Insertar cada variante
    for (const v of (variantes || [])) {
      const varResult = await client.query(`
        INSERT INTO producto_variantes (producto_id, color_id, sku, precio_adicional)
        VALUES ($1,$2,$3,$4)
        RETURNING id
      `, [productoId, v.color_id || null, v.sku, v.precio_adicional || 0]);
      const varianteId = varResult.rows[0].id;

      // Atributos de la variante
      for (const attr of (v.atributos || [])) {
        await client.query(
          'INSERT INTO variante_atributos (variante_id, tipo_atributo_id, valor_atributo_id) VALUES ($1,$2,$3)',
          [varianteId, attr.tipo_atributo_id, attr.valor_atributo_id]
        );
      }

      // Inventario inicial
      await client.query(
        'INSERT INTO inventario (variante_id, cantidad_disponible, cantidad_minima) VALUES ($1,$2,$3)',
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

// ─── ACTUALIZAR PRODUCTO BASE ─────────────────────────────
const actualizarProducto = async (id, { nombre, descripcion, precio_base, categoria_id, subcategoria_id, marca_id, material_id, imagen_url }) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  if (!precio_base)    throw new Error('El precio es requerido');
  if (!categoria_id)   throw new Error('La categoría es requerida');

  const result = await db.query(`
    UPDATE productos SET
      nombre = $1, descripcion = $2, precio_base = $3,
      categoria_id = $4, subcategoria_id = $5,
      marca_id = $6, material_id = $7, imagen_url = $8
    WHERE id = $9
    RETURNING *
  `, [nombre, descripcion || null, precio_base, categoria_id,
      subcategoria_id || null, marca_id || null, material_id || null,
      imagen_url, id]);

  if (result.rowCount === 0) throw new Error('Producto no encontrado');
  return result.rows[0];
};

// ─── ELIMINAR PRODUCTO ────────────────────────────────────
const eliminarProducto = async (id) => {
  const prod = await db.query('SELECT imagen_url FROM productos WHERE id = $1', [id]);
  if (prod.rowCount === 0) throw new Error('Producto no encontrado');

  await db.query('DELETE FROM productos WHERE id = $1', [id]);
  return { mensaje: 'Producto eliminado', imagen_url: prod.rows[0].imagen_url };
};

// ─── AGREGAR VARIANTE A PRODUCTO EXISTENTE ────────────────
const agregarVariante = async (productoId, { color_id, sku, precio_adicional, atributos, stock, stock_minimo }) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const varResult = await client.query(`
      INSERT INTO producto_variantes (producto_id, color_id, sku, precio_adicional)
      VALUES ($1,$2,$3,$4) RETURNING id
    `, [productoId, color_id || null, sku, precio_adicional || 0]);
    const varianteId = varResult.rows[0].id;

    for (const attr of (atributos || [])) {
      await client.query(
        'INSERT INTO variante_atributos (variante_id, tipo_atributo_id, valor_atributo_id) VALUES ($1,$2,$3)',
        [varianteId, attr.tipo_atributo_id, attr.valor_atributo_id]
      );
    }

    await client.query(
      'INSERT INTO inventario (variante_id, cantidad_disponible, cantidad_minima) VALUES ($1,$2,$3)',
      [varianteId, stock || 0, stock_minimo || 5]
    );

    await client.query('COMMIT');
    return { id: varianteId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── ELIMINAR VARIANTE ────────────────────────────────────
const eliminarVariante = async (varianteId) => {
  const result = await db.query('DELETE FROM producto_variantes WHERE id = $1 RETURNING *', [varianteId]);
  if (result.rowCount === 0) throw new Error('Variante no encontrada');
  return { mensaje: 'Variante eliminada' };
};

// ─── ACTUALIZAR STOCK ─────────────────────────────────────
const actualizarStock = async (varianteId, cantidad) => {
  const result = await db.query(
    'UPDATE inventario SET cantidad_disponible = $1, actualizado_en = NOW() WHERE variante_id = $2 RETURNING *',
    [cantidad, varianteId]
  );
  if (result.rowCount === 0) throw new Error('Inventario no encontrado');
  return result.rows[0];
};

module.exports = {
  obtenerColores, obtenerMateriales, obtenerTiposAtributo,
  obtenerProductos, obtenerProductoDetalle,
  crearProductoCompleto, actualizarProducto, eliminarProducto,
  agregarVariante, eliminarVariante, actualizarStock
};