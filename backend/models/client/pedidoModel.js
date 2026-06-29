// models/client/pedidoModel.js
const pool = require('../../config/db');
const carritoModel = require('./carritoModel');

// ─── CREAR PEDIDO DESDE CARRITO ────────────────────────────────────
const crearPedidoDesdeCarrito = async (usuarioId, metodoEntregaId, direccionEnvio, distanciaKm) => {
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
      const subtotal = item.cantidad * parseFloat(item.precio_unitario);
      totalProductos += subtotal;
      return {
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio_unitario)
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
    let costoEnvio = parseFloat(metodo.costo);
    
    // Si es dinámico por km, calcular
    if (metodo.es_dinamico_km && distanciaKm) {
      const costoCalculado = distanciaKm * parseFloat(metodo.costo_por_km);
      costoEnvio = Math.max(costoCalculado, parseFloat(metodo.costo_minimo));
    }
    
    const totalGeneral = totalProductos + costoEnvio;
    const montoAnticipo = totalGeneral * 0.5;
    const montoRestante = totalGeneral * 0.5;
    
    // 4. Crear pedido
    const pedidoQuery = `
      INSERT INTO ventas.pedidos_clientes (
        usuario_id, metodo_entrega_id, total_productos, costo_envio,
        total_general, monto_anticipo, monto_restante, estado,
        direccion_envio, distancia_km_calculada
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE_VERIFICACION', $8, $9)
      RETURNING id
    `;
    const pedidoValues = [
      usuarioId, 
      metodoEntregaId, 
      totalProductos, 
      costoEnvio,
      totalGeneral, 
      montoAnticipo, 
      montoRestante,
      direccionEnvio, 
      distanciaKm || null
    ];
    const pedidoResult = await client.query(pedidoQuery, pedidoValues);
    const pedidoId = pedidoResult.rows[0].id;
    
    // 5. Guardar detalles del pedido
    for (const detalle of detalles) {
      const detalleQuery = `
        INSERT INTO ventas.pedido_cliente_detalle (
          pedido_cliente_id, variante_id, cantidad, precio_unitario
        ) VALUES ($1, $2, $3, $4)
      `;
      await client.query(detalleQuery, [pedidoId, detalle.variante_id, detalle.cantidad, detalle.precio_unitario]);
    }
    
    // 6. Vaciar carrito
    await client.query(
      'DELETE FROM ventas.carrito_detalle WHERE carrito_id = (SELECT id FROM ventas.carrito WHERE usuario_id = $1)',
      [usuarioId]
    );
    
    await client.query('COMMIT');
    
    return {
      pedidoId,
      totalGeneral,
      montoAnticipo,
      montoRestante,
      costoEnvio
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ─── REGISTRAR PAGO ─────────────────────────────────────────────────
const registrarPago = async (pedidoId, tipoPago, monto, metodoPago, comprobanteUrl) => {
  const query = `
    INSERT INTO ventas.pagos_pedidos (
      pedido_cliente_id, tipo_pago, monto, metodo_pago, comprobante_url, estado_pago
    ) VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING *
  `;
  const { rows } = await pool.query(query, [pedidoId, tipoPago, monto, metodoPago, comprobanteUrl]);
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
            'metodo_pago', pg.metodo_pago,
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
    WHERE p.usuario_id = $1
    ORDER BY p.fecha_pedido DESC
  `;
  const { rows } = await pool.query(query, [usuarioId]);
  return rows;
};

// Agrégala al module.exports:
module.exports = {
  crearPedidoDesdeCarrito,
  registrarPago,
  obtenerDetallePedido,
  obtenerPedidosUsuario  
};
