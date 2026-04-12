const pool = require('../../config/db');

// Obtener items del carrito con datos del producto personalizado
const obtenerItemsCarrito = async (usuarioId) => {
  const query = `
    SELECT 
      c.id AS carrito_id,
      c.cantidad,
      c.precio_unitario,
      c.producto_personalizado_id,
      pp.imagen_personalizada_url,
      pp.texto_personalizado,
      p.nombre AS producto_nombre,
      col.nombre AS color
    FROM ventas.carrito_compras c
    JOIN productos.productos_personalizados pp ON c.producto_personalizado_id = pp.id
    JOIN productos.producto_variantes pv ON pp.variante_id = pv.id
    JOIN productos.productos p ON pv.producto_id = p.id
    LEFT JOIN productos.colores col ON pv.color_id = col.id
    WHERE c.usuario_id = $1;
  `;
  const { rows } = await pool.query(query, [usuarioId]);
  return rows;
};

// Crear la venta principal
const crearVenta = async (usuarioId, totalVenta, anticipo, saldo, formaPago, formaEntrega, direccionEntrega) => {
  const query = `
    INSERT INTO inventario.ventas 
      (usuario_id, total_venta, anticipo, saldo, forma_pago, forma_entrega, direccion_entrega, estado_pedido)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente_aprobacion')
    RETURNING id;
  `;
  const values = [usuarioId, totalVenta, anticipo, saldo, formaPago, formaEntrega, direccionEntrega];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Insertar detalle de venta
const agregarDetalleVenta = async (ventaId, productoPersonalizadoId, cantidad, precioUnitario) => {
  const total = cantidad * precioUnitario;
  const query = `
    INSERT INTO inventario.ventas_detalle 
      (venta_id, producto_personalizado_id, cantidad, precio_unitario, total)
    VALUES ($1, $2, $3, $4, $5);
  `;
  await pool.query(query, [ventaId, productoPersonalizadoId, cantidad, precioUnitario, total]);
};

// Vaciar carrito del usuario
const vaciarCarrito = async (usuarioId) => {
  await pool.query('DELETE FROM ventas.carrito_compras WHERE usuario_id = $1', [usuarioId]);
};

// Obtener ID del método de pago por nombre
const obtenerMetodoPagoId = async (nombre) => {
  const res = await pool.query('SELECT id FROM ventas.metodo_pago WHERE nombre = $1', [nombre]);
  return res.rows[0]?.id || null;
};

// Registrar pago en ventas_pago
const registrarPago = async (ventaId, metodoPagoId, montoPagado) => {
  const query = `
    INSERT INTO ventas.ventas_pago (venta_id, metodo_pago_id, monto_pagado)
    VALUES ($1, $2, $3);
  `;
  await pool.query(query, [ventaId, metodoPagoId, montoPagado]);
};

module.exports = {
  obtenerItemsCarrito,
  crearVenta,
  agregarDetalleVenta,
  vaciarCarrito,
  obtenerMetodoPagoId,
  registrarPago,
};