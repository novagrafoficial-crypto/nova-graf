// backend/models/client/pedidoModel.js
const pool = require('../../config/db');

// ─── CREAR PEDIDO DESDE CARRITO ────────────────────────────────────
const crearPedidoDesdeCarrito = async (usuarioId, metodoEntregaId, metodoPagoId, direccionEnvio, distanciaKm) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Obtener datos del carrito
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
    
    // 2. Calcular totales
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
    
    // 3. Obtener costo de envío
    const metodoQuery = `
      SELECT costo, es_dinamico_km, costo_por_km, costo_minimo
      FROM ventas.metodos_entrega
      WHERE id = $1 AND activo = true
    `;
    const metodoResult = await client.query(metodoQuery, [metodoEntregaId]);
    
    if (metodoResult.rows.length === 0) {
      throw new Error('Método de entrega no válido');
    }
    
    const metodo = metodoResult.rows[0];
    let costoEnvio = parseFloat(metodo.costo) || 0;
    
    if (metodo.es_dinamico_km && distanciaKm) {
      const costoCalculado = distanciaKm * parseFloat(metodo.costo_por_km);
      costoEnvio = Math.max(costoCalculado, parseFloat(metodo.costo_minimo) || 0);
    }
    
    const totalGeneral = totalProductos + costoEnvio;
    const montoAnticipo = totalGeneral * 0.5;
    const montoRestante = totalGeneral * 0.5;
    
    // 4. Crear pedido CON metodo_pago_id
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
      metodoPagoId,      // ← NUEVO
      totalProductos, 
      costoEnvio,
      totalGeneral, 
      montoAnticipo, 
      montoRestante,
      direccionEnvio, 
      distanciaKm || null
    ];
    const pedidoResult = await client.query(pedidoQuery, pedidoValues);
    const pedido = pedidoResult.rows[0];
    
    // 5. Guardar detalles del pedido
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
    
    // 6. Vaciar carrito
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

// ─── REGISTRAR PAGO  ─────────────────────────────
const registrarPago = async (pedidoId, tipoPago, monto, comprobanteUrl) => {
  const query = `
    INSERT INTO ventas.pagos_pedidos (
      pedido_cliente_id, 
      tipo_pago, 
      monto, 
      comprobante_url, 
      estado_pago
    ) VALUES ($1, $2, $3, $4, 'PENDIENTE')
    RETURNING *
  `;
  const { rows } = await pool.query(query, [
    pedidoId, 
    tipoPago, 
    monto, 
    comprobanteUrl,
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

module.exports = {
  crearPedidoDesdeCarrito,
  registrarPago,
  obtenerDetallePedido,
  obtenerPedidosUsuario
};