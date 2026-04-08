const db = require('../../config/db');

// 🔍 Obtener inventario con JOIN (IMPORTANTE 🔥)
const obtenerInventario = async () => {
  const result = await db.query(`
    SELECT 
      i.*,
      p.nombre AS producto_nombre,
      v.sku

    FROM inventario.inventario i

    JOIN productos.producto_variantes v 
      ON i.variante_id = v.id

    JOIN productos.productos p 
      ON v.producto_id = p.id

    ORDER BY i.id ASC
  `);

  return result.rows;
};

// 🔍 Obtener uno por ID
const obtenerInventarioPorId = async (id) => {
  const result = await db.query(`
    SELECT * FROM inventario.inventario WHERE id = $1
  `, [id]);

  return result.rows[0];
};

// ➕ Crear
const crearInventario = async (data) => {
  const result = await db.query(`
    INSERT INTO inventario.inventario (
      variante_id,
      cantidad_disponible,
      cantidad_minima,
      demanda_anual,
      costo_pedido,
      costo_mantenimiento,
      tiempo_entrega,
      desviacion_demanda,
      nivel_servicio
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `, [
    data.variante_id,
    data.cantidad_disponible,
    data.cantidad_minima,
    data.demanda_anual,
    data.costo_pedido,
    data.costo_mantenimiento,
    data.tiempo_entrega,
    data.desviacion_demanda,
    data.nivel_servicio
  ]);

  return result.rows[0];
};

// ✏️ Actualizar
const actualizarInventario = async (id, data) => {
  const result = await db.query(`
    UPDATE inventario.inventario SET
      cantidad_disponible = $1,
      cantidad_minima = $2,
      demanda_anual = $3,
      costo_pedido = $4,
      costo_mantenimiento = $5,
      tiempo_entrega = $6,
      desviacion_demanda = $7,
      nivel_servicio = $8,
      actualizado_en = NOW()
    WHERE id = $9
    RETURNING *
  `, [
    data.cantidad_disponible,
    data.cantidad_minima,
    data.demanda_anual,
    data.costo_pedido,
    data.costo_mantenimiento,
    data.tiempo_entrega,
    data.desviacion_demanda,
    data.nivel_servicio,
    id
  ]);

  return result.rows[0];
};

// ❌ Eliminar
const eliminarInventario = async (id) => {
  await db.query(`DELETE FROM inventario.inventario WHERE id = $1`, [id]);
};

module.exports = {
  obtenerInventario,
  obtenerInventarioPorId,
  crearInventario,
  actualizarInventario,
  eliminarInventario
};