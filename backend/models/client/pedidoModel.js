// backend/models/client/pedidoModel.js
const pool = require('../../config/db');

// ─── CREAR PEDIDO DESDE CARRITO ────────────────────────────────────
const crearPedidoDesdeCarrito = async (usuarioId, metodoEntregaId, metodoPagoId, direccionEnvio, distanciaKm) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const carritoQuery = `
      SELECT 
        cd.variante_id,
        cd.cantidad,
        p.precio_base,
        pv.precio_adicional,
        (p.precio_base + COALESCE(pv.precio_adicional, 0)) AS precio_unitario
      FROM ventas.carrito c
      JOIN ventas.carrito_detalle cd ON c.id = cd.carrito_id
      JOIN productos.producto_variantes pv ON cd.variante_id = pv.id
      JOIN productos.productos p ON pv.producto_id = p.id
      WHERE c.usuario_id = $1
    `;
    const carritoItems = await client.query(carritoQuery, [usuarioId]);
    
    if (carritoItems.rows.length === 0) {
      throw new Error('El carrito está vacío');
    }
    
    let totalProductos = 0;
    const detalles = carritoItems.rows.map(item => {
      const precioUnitario = parseFloat(item.precio_unitario);
      const subtotal = item.cantidad * precioUnitario;
      totalProductos += subtotal;
      return {
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario
      };
    });
    
    const metodoQuery = `
      SELECT costo
      FROM ventas.metodos_entrega
      WHERE id = $1 AND activo = true
    `;
    const metodoResult = await client.query(metodoQuery, [metodoEntregaId]);
    
    if (metodoResult.rows.length === 0) {
      throw new Error('Método de entrega no válido');
    }
    
    const metodo = metodoResult.rows[0];
    const costoEnvio = parseFloat(metodo.costo) || 0;
    
    const totalGeneral = totalProductos + costoEnvio;
    const montoAnticipo = totalGeneral * 0.5;
    const montoRestante = totalGeneral * 0.5;
    
    const pedidoQuery = `
      INSERT INTO ventas.pedidos_clientes (
        usuario_id, 
        metodo_entrega_id, 
        metodo_pago_id,
        total_productos, 
        costo_envio,
        total_general, 
        monto_anticipo, 
        monto_restante, 
        estado,
        direccion_envio, 
        distancia_km_calculada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDIENTE_VERIFICACION', $9, $10)
      RETURNING id, total_general, monto_anticipo, monto_restante, costo_envio
    `;
    const pedidoValues = [
      usuarioId, 
      metodoEntregaId,
      metodoPagoId,
      totalProductos, 
      costoEnvio,
      totalGeneral, 
      montoAnticipo, 
      montoRestante,
      direccionEnvio, 
      null
    ];
    const pedidoResult = await client.query(pedidoQuery, pedidoValues);
    const pedido = pedidoResult.rows[0];
    
    for (const detalle of detalles) {
      const detalleQuery = `
        INSERT INTO ventas.pedido_cliente_detalle (
          pedido_cliente_id, variante_id, cantidad, precio_unitario
        ) VALUES ($1, $2, $3, $4)
      `;
      await client.query(detalleQuery, [
        pedido.id, 
        detalle.variante_id, 
        detalle.cantidad, 
        detalle.precio_unitario
      ]);
    }
    
    await client.query(
      'DELETE FROM ventas.carrito_detalle WHERE carrito_id = (SELECT id FROM ventas.carrito WHERE usuario_id = $1)',
      [usuarioId]
    );
    
    await client.query('COMMIT');
    
    return {
      pedidoId: pedido.id,
      totalGeneral: parseFloat(pedido.total_general),
      montoAnticipo: parseFloat(pedido.monto_anticipo),
      montoRestante: parseFloat(pedido.monto_restante),
      costoEnvio: parseFloat(pedido.costo_envio)
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ─── REGISTRAR PAGO ─────────────────────────────────────────────────
const registrarPago = async (pedidoId, tipoPago, monto, comprobanteUrl, notasAdmin) => {
  const query = `
    INSERT INTO ventas.pagos_pedidos (
      pedido_cliente_id, 
      tipo_pago, 
      monto, 
      comprobante_url,
      notas_admin,
      estado_pago
    ) VALUES ($1, $2, $3, $4, $5, 'PENDIENTE')
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    pedidoId, 
    tipoPago, 
    monto, 
    comprobanteUrl,
    notasAdmin || null
  ]);
  return rows[0];
};

// ─── OBTENER DETALLE DEL PEDIDO ────────────────────────────────────
const obtenerDetallePedido = async (pedidoId, usuarioId) => {
  const query = `
    SELECT 
      p.id,
      p.fecha_pedido,
      p.total_productos,
      p.costo_envio,
      p.total_general,
      p.monto_anticipo,
      p.monto_restante,
      p.estado,
      p.direccion_envio,
      p.distancia_km_calculada,
      p.fecha_entrega_estimada,
      p.metodo_pago_id,                     -- ← ✅ AGREGAR ESTA LÍNEA
      me.nombre AS metodo_entrega_nombre,
      me.tipo AS metodo_entrega_tipo,
      mp.nombre AS metodo_pago_nombre,
      mp.tipo AS metodo_pago_tipo,
      (
        SELECT json_agg(
          json_build_object(
            'variante_id', pd.variante_id,
            'cantidad', pd.cantidad,
            'precio_unitario', pd.precio_unitario,
            'subtotal', pd.cantidad * pd.precio_unitario,
            'producto_nombre', pr.nombre,
            'color', col.nombre,
            'imagen_url', pv.imagen_url
          )
        )
        FROM ventas.pedido_cliente_detalle pd
        JOIN productos.producto_variantes pv ON pd.variante_id = pv.id
        JOIN productos.productos pr ON pv.producto_id = pr.id
        LEFT JOIN productos.colores col ON pv.color_id = col.id
        WHERE pd.pedido_cliente_id = p.id
      ) AS detalles,
      (
        SELECT json_agg(
          json_build_object(
            'id', pg.id,
            'tipo_pago', pg.tipo_pago,
            'monto', pg.monto,
            'comprobante_url', pg.comprobante_url,
            'estado_pago', pg.estado_pago,
            'fecha_pago', pg.fecha_pago,
            'notas_admin', pg.notas_admin
          ) ORDER BY pg.fecha_pago DESC
        )
        FROM ventas.pagos_pedidos pg
        WHERE pg.pedido_cliente_id = p.id
      ) AS pagos
    FROM ventas.pedidos_clientes p
    JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
    LEFT JOIN ventas.metodos_pago mp ON p.metodo_pago_id = mp.id
    WHERE p.id = $1 AND p.usuario_id = $2
  `;
  const { rows } = await pool.query(query, [pedidoId, usuarioId]);
  return rows[0] || null;
};

// ─── OBTENER PEDIDOS DEL USUARIO ──────────────────────────────────
// ✅ CORREGIDO: AGREGAR p.metodo_pago_id
const obtenerPedidosUsuario = async (usuarioId) => {
  const query = `
    SELECT 
      p.id,
      p.fecha_pedido,
      p.total_productos,
      p.costo_envio,
      p.total_general,
      p.monto_anticipo,
      p.monto_restante,
      p.estado,
      p.direccion_envio,
      p.metodo_pago_id,                     -- ← ✅ AGREGAR ESTA LÍNEA
      me.nombre AS metodo_entrega_nombre,
      mp.nombre AS metodo_pago_nombre,
      (
        SELECT json_agg(
          json_build_object(
            'variante_id', pd.variante_id,
            'cantidad', pd.cantidad,
            'precio_unitario', pd.precio_unitario,
            'subtotal', pd.cantidad * pd.precio_unitario,
            'producto_nombre', pr.nombre,
            'color', col.nombre,
            'imagen_url', pv.imagen_url
          )
        )
        FROM ventas.pedido_cliente_detalle pd
        JOIN productos.producto_variantes pv ON pd.variante_id = pv.id
        JOIN productos.productos pr ON pv.producto_id = pr.id
        LEFT JOIN productos.colores col ON pv.color_id = col.id
        WHERE pd.pedido_cliente_id = p.id
      ) AS detalles,
      (
        SELECT json_agg(
          json_build_object(
            'id', pg.id,
            'tipo_pago', pg.tipo_pago,
            'monto', pg.monto,
            'comprobante_url', pg.comprobante_url,
            'estado_pago', pg.estado_pago,
            'notas_admin', pg.notas_admin,
            'fecha_pago', pg.fecha_pago
          ) ORDER BY pg.fecha_pago DESC
        )
        FROM ventas.pagos_pedidos pg
        WHERE pg.pedido_cliente_id = p.id
      ) AS pagos
    FROM ventas.pedidos_clientes p
    JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
    LEFT JOIN ventas.metodos_pago mp ON p.metodo_pago_id = mp.id
    WHERE p.usuario_id = $1
    ORDER BY p.fecha_pedido DESC
  `;
  const { rows } = await pool.query(query, [usuarioId]);
  return rows;
};

// ─── ACTUALIZAR ESTADO DEL PEDIDO ──────────────────────────────────
const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
  const query = `
    UPDATE ventas.pedidos_clientes 
    SET estado = $1 
    WHERE id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [nuevoEstado, pedidoId]);
  return rows[0];
};

// ─── CALCULAR MONTO PENDIENTE ──────────────────────────────────────
const calcularMontoPendiente = async (pedidoId) => {
  const query = `
    SELECT 
      p.total_general,
      COALESCE(
        (SELECT SUM(monto) 
         FROM ventas.pagos_pedidos 
         WHERE pedido_cliente_id = p.id 
         AND estado_pago = 'APROBADO'),
        0
      ) as total_pagado
    FROM ventas.pedidos_clientes p
    WHERE p.id = $1
  `;
  const { rows } = await pool.query(query, [pedidoId]);
  
  if (rows.length === 0) {
    throw new Error('Pedido no encontrado');
  }
  
  const totalGeneral = parseFloat(rows[0].total_general);
  const totalPagado = parseFloat(rows[0].total_pagado);
  const pendiente = totalGeneral - totalPagado;
  
  return pendiente > 0 ? pendiente : 0;
};
// ─── REGISTRAR PAGO FINAL ──────────────────────────────────────────
const registrarPagoFinal = async (pedidoId, tipoPago, monto, comprobanteUrl, notasAdmin) => {
  const query = `
    INSERT INTO ventas.pagos_pedidos (
      pedido_cliente_id,
      tipo_pago,
      monto,
      comprobante_url,
      notas_admin,
      estado_pago,
      fecha_pago
    ) VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const values = [
    pedidoId,
    tipoPago || 'SALDO_FINAL',
    monto,
    comprobanteUrl,
    notasAdmin || null
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  crearPedidoDesdeCarrito,
  registrarPago,
  obtenerDetallePedido,
  obtenerPedidosUsuario,
  actualizarEstadoPedido,
  calcularMontoPendiente,
  registrarPagoFinal
};