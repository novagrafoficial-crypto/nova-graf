// models/client/carritoModel.js
const pool = require('../../config/db');

// ─── CREAR O OBTENER CARRITO ACTIVO ──────────────────────────────
const obtenerOCrearCarrito = async (usuarioId) => {
  try {
    let query = `
      SELECT id FROM ventas.carrito 
      WHERE usuario_id = $1 
      ORDER BY fecha_creacion DESC 
      LIMIT 1
    `;
    let { rows } = await pool.query(query, [usuarioId]);
    
    if (rows.length > 0) {
      return rows[0].id;
    }
    
    query = `
      INSERT INTO ventas.carrito (usuario_id) 
      VALUES ($1) 
      RETURNING id
    `;
    const result = await pool.query(query, [usuarioId]);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error en obtenerOCrearCarrito:', error);
    throw error;
  }
};

// ─── AGREGAR AL CARRITO ────────────────────────────────────────────
const agregarAlCarrito = async (usuarioId, varianteId, cantidad) => {
  if (!cantidad || cantidad < 1) {
    throw new Error('La cantidad debe ser mayor a 0');
  }

  try {
    const carritoId = await obtenerOCrearCarrito(usuarioId);
    
    const queryCheck = `
      SELECT id, cantidad FROM ventas.carrito_detalle 
      WHERE carrito_id = $1 AND variante_id = $2
    `;
    const checkResult = await pool.query(queryCheck, [carritoId, varianteId]);
    
    if (checkResult.rows.length > 0) {
      const nuevaCantidad = checkResult.rows[0].cantidad + cantidad;
      const queryUpdate = `
        UPDATE ventas.carrito_detalle 
        SET cantidad = $1, fecha_agregado = NOW()
        WHERE id = $2
        RETURNING *
      `;
      const { rows } = await pool.query(queryUpdate, [nuevaCantidad, checkResult.rows[0].id]);
      return rows[0];
    } else {
      const queryInsert = `
        INSERT INTO ventas.carrito_detalle (carrito_id, variante_id, cantidad)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const { rows } = await pool.query(queryInsert, [carritoId, varianteId, cantidad]);
      return rows[0];
    }
  } catch (error) {
    console.error('Error en agregarAlCarrito:', error);
    throw error;
  }
};

// ─── OBTENER CARRITO COMPLETO ──────────────────────────────────────
const obtenerCarrito = async (usuarioId) => {
  try {
    const query = `
      SELECT 
        cd.id AS detalle_id,
        cd.cantidad,
        pv.id AS variante_id,
        pv.imagen_url,
        pv.precio_adicional,
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.descripcion,
        p.precio_base,
        (p.precio_base + COALESCE(pv.precio_adicional, 0)) AS precio_unitario,
        (cd.cantidad * (p.precio_base + COALESCE(pv.precio_adicional, 0))) AS subtotal,
        col.nombre AS color
      FROM ventas.carrito c
      JOIN ventas.carrito_detalle cd ON c.id = cd.carrito_id
      JOIN productos.producto_variantes pv ON cd.variante_id = pv.id
      JOIN productos.productos p ON pv.producto_id = p.id
      LEFT JOIN productos.colores col ON pv.color_id = col.id
      WHERE c.usuario_id = $1
      ORDER BY cd.fecha_agregado DESC
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
  } catch (error) {
    console.error('Error en obtenerCarrito:', error);
    throw error;
  }
};

// ─── OBTENER CONTE O DE ITEMS ──────────────────────────────────────
const obtenerConteoCarrito = async (usuarioId) => {
  try {
    const query = `
      SELECT COALESCE(SUM(cd.cantidad), 0) AS total_items
      FROM ventas.carrito c
      JOIN ventas.carrito_detalle cd ON c.id = cd.carrito_id
      WHERE c.usuario_id = $1
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return parseInt(rows[0].total_items) || 0;
  } catch (error) {
    console.error('Error en obtenerConteoCarrito:', error);
    throw error;
  }
};

// ─── ACTUALIZAR CANTIDAD ───────────────────────────────────────────
const actualizarCantidad = async (detalleId, usuarioId, cantidad) => {
  if (!cantidad || cantidad < 1) {
    throw new Error('La cantidad debe ser mayor a 0');
  }

  try {
    const query = `
      UPDATE ventas.carrito_detalle cd
      SET cantidad = $1
      FROM ventas.carrito c
      WHERE cd.id = $2 AND c.id = cd.carrito_id AND c.usuario_id = $3
      RETURNING cd.*
    `;
    const { rows } = await pool.query(query, [cantidad, detalleId, usuarioId]);
    return rows[0];
  } catch (error) {
    console.error('Error en actualizarCantidad:', error);
    throw error;
  }
};

// ─── ELIMINAR DEL CARRITO ──────────────────────────────────────────
const eliminarDelCarrito = async (detalleId, usuarioId) => {
  try {
    const query = `
      DELETE FROM ventas.carrito_detalle cd
      USING ventas.carrito c
      WHERE cd.id = $1 AND c.id = cd.carrito_id AND c.usuario_id = $2
      RETURNING cd.*
    `;
    const { rows } = await pool.query(query, [detalleId, usuarioId]);
    return rows[0];
  } catch (error) {
    console.error('Error en eliminarDelCarrito:', error);
    throw error;
  }
};

// ─── VACIAR CARRITO ────────────────────────────────────────────────
const vaciarCarrito = async (usuarioId) => {
  try {
    const query = `
      DELETE FROM ventas.carrito_detalle cd
      USING ventas.carrito c
      WHERE c.id = cd.carrito_id AND c.usuario_id = $1
      RETURNING cd.*
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
  } catch (error) {
    console.error('Error en vaciarCarrito:', error);
    throw error;
  }
};

// ─── OBTENER TOTAL DEL CARRITO ─────────────────────────────────────
const obtenerTotalCarrito = async (usuarioId) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(cd.cantidad * (p.precio_base + COALESCE(pv.precio_adicional, 0))), 0) AS total
      FROM ventas.carrito c
      JOIN ventas.carrito_detalle cd ON c.id = cd.carrito_id
      JOIN productos.producto_variantes pv ON cd.variante_id = pv.id
      JOIN productos.productos p ON pv.producto_id = p.id
      WHERE c.usuario_id = $1
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return parseFloat(rows[0].total) || 0;
  } catch (error) {
    console.error('Error en obtenerTotalCarrito:', error);
    throw error;
  }
};

module.exports = {
  obtenerOCrearCarrito,
  agregarAlCarrito,
  obtenerCarrito,
  obtenerConteoCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  vaciarCarrito,
  obtenerTotalCarrito
};