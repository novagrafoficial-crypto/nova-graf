// models/client/pedidosModel.js
const pool = require('../../config/db');

// ─── CREAR PEDIDO DESDE CARRITO ────────────────────────────────────
const crearPedidoDesdeCarrito = async (usuarioId, metodoEntregaId, direccionEnvio, distanciaKm) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Obtener datos del carrito
    const carritoQuery = `
      SELECT 
        c.id AS carrito_id,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const pedidoValues = [
      usuarioId, metodoEntregaId, totalProductos, costoEnvio,
      totalGeneral, montoAnticipo, montoRestante, 'WAITING_DEPOSIT_VERIFICATION',
      direccionEnvio, distanciaKm || null
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
    await client.query('DELETE FROM ventas.carrito_detalle WHERE carrito_id = (SELECT id FROM ventas.carrito WHERE usuario_id = $1)', [usuarioId]);
    
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

// ─── APROBAR PAGO ───────────────────────────────────────────────────
const aprobarPago = async (pedidoId, tipoPago) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Actualizar pago
    const pagoQuery = `
      UPDATE ventas.pagos_pedidos 
      SET estado_pago = 'approved' 
      WHERE pedido_cliente_id = $1 AND tipo_pago = $2
      RETURNING *
    `;
    await client.query(pagoQuery, [pedidoId, tipoPago]);
    
    // Actualizar estado del pedido según el tipo de pago
    let nuevoEstado = '';
    if (tipoPago === 'ANTICIPO') {
      nuevoEstado = 'DESIGNING';
    } else if (tipoPago === 'SALDO_FINAL') {
      nuevoEstado = 'SHIPPED';
      // Si es saldo final, actualizar fecha de entrega estimada
      await client.query(`
        UPDATE ventas.pedidos_clientes 
        SET fecha_entrega_estimada = NOW() + INTERVAL '1 day'
        WHERE id = $1
      `, [pedidoId]);
    }
    
    if (nuevoEstado) {
      await client.query(
        'UPDATE ventas.pedidos_clientes SET estado = $1 WHERE id = $2',
        [nuevoEstado, pedidoId]
      );
    }
    
    await client.query('COMMIT');
    return { success: true, nuevoEstado };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ─── OBTENER DETALLE DEL PEDIDO ────────────────────────────────────
const obtenerDetallePedido = async (pedidoId, usuarioId) => {
  const query = `
    SELECT 
      p.*,
      me.nombre AS metodo_entrega_nombre,
      me.tipo AS metodo_entrega_tipo,
      (
        SELECT json_agg(
          json_build_object(
            'variante_id', pd.variante_id,
            'cantidad', pd.cantidad,
            'precio_unitario', pd.precio_unitario,
            'subtotal', pd.cantidad * pd.precio_unitario,
            'producto_nombre', pr.producto_nombre,
            'color', pv.color,
            'imagen_url', pv.imagen_url
          )
        )
        FROM ventas.pedido_cliente_detalle pd
        JOIN productos.producto_variantes pv ON pd.variante_id = pv.id
        JOIN productos.productos pr ON pv.producto_id = pr.id
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
      ) AS pagos,
      (
        SELECT json_agg(
          json_build_object(
            'id', dc.id,
            'tipo_origen', dc.tipo_origen,
            'archivo_url', dc.archivo_url,
            'simulador_json', dc.simulador_json,
            'notas_cliente', dc.notas_cliente,
            'fecha_envio', dc.fecha_envio
          ) ORDER BY dc.fecha_envio DESC
        )
        FROM ventas.disenos_clientes dc
        WHERE dc.pedido_cliente_id = p.id
      ) AS disenos,
      (
        SELECT json_agg(
          json_build_object(
            'id', cp.id,
            'remitente_id', cp.remitente_id,
            'mensaje', cp.mensaje,
            'leido', cp.leido,
            'fecha_envio', cp.fecha_envio,
            'remitente_nombre', u.nombre
          ) ORDER BY cp.fecha_envio ASC
        )
        FROM ventas.chat_pedidos cp
        JOIN public.usuarios u ON cp.remitente_id = u.id_usuario
        WHERE cp.pedido_cliente_id = p.id
      ) AS chat,
      (
        SELECT json_agg(
          json_build_object(
            'id', pd2.id,
            'numero_previa', pd2.numero_previa,
            'imagen_url', pd2.imagen_url,
            'aprobada', pd2.aprobada,
            'fecha_subida', pd2.fecha_subida,
            'fecha_aprobacion', pd2.fecha_aprobacion
          ) ORDER BY pd2.numero_previa ASC
        )
        FROM ventas.previas_diseno pd2
        WHERE pd2.pedido_cliente_id = p.id
      ) AS previas
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
      p.total_general,
      p.estado,
      p.monto_anticipo,
      p.monto_restante,
      p.fecha_entrega_estimada,
      me.nombre AS metodo_entrega,
      COUNT(pd.id) AS total_productos,
      SUM(pd.cantidad) AS cantidad_productos
    FROM ventas.pedidos_clientes p
    JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
    LEFT JOIN ventas.pedido_cliente_detalle pd ON p.id = pd.pedido_cliente_id
    WHERE p.usuario_id = $1
    GROUP BY p.id, me.nombre
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

// ─── AGREGAR DISEÑO AL PEDIDO ──────────────────────────────────────
const agregarDiseno = async (pedidoId, tipoOrigen, archivoUrl, simuladorJson, notasCliente) => {
  const query = `
    INSERT INTO ventas.disenos_clientes (
      pedido_cliente_id, tipo_origen, archivo_url, simulador_json, notas_cliente
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [pedidoId, tipoOrigen, archivoUrl, simuladorJson, notasCliente]);
  return rows[0];
};

// ─── AGREGAR MENSAJE AL CHAT ──────────────────────────────────────
const agregarMensajeChat = async (pedidoId, remitenteId, mensaje) => {
  const query = `
    INSERT INTO ventas.chat_pedidos (pedido_cliente_id, remitente_id, mensaje)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [pedidoId, remitenteId, mensaje]);
  return rows[0];
};

// ─── AGREGAR PREVIA ─────────────────────────────────────────────────
const agregarPrevia = async (pedidoId, numeroPrevia, imagenUrl) => {
  const query = `
    INSERT INTO ventas.previas_diseno (pedido_cliente_id, numero_previa, imagen_url)
    VALUES ($1, $2, $3)
    ON CONFLICT (pedido_cliente_id, numero_previa) 
    DO UPDATE SET imagen_url = $3, fecha_subida = NOW()
    RETURNING *
  `;
  const { rows } = await pool.query(query, [pedidoId, numeroPrevia, imagenUrl]);
  return rows[0];
};

// ─── APROBAR PREVIA ────────────────────────────────────────────────
const aprobarPrevia = async (pedidoId, numeroPrevia) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Marcar previa como aprobada
    const previaQuery = `
      UPDATE ventas.previas_diseno 
      SET aprobada = TRUE, fecha_aprobacion = NOW() 
      WHERE pedido_cliente_id = $1 AND numero_previa = $2
      RETURNING *
    `;
    const previaResult = await client.query(previaQuery, [pedidoId, numeroPrevia]);
    
    // Actualizar estado del pedido a "IN_PRODUCTION"
    await client.query(
      'UPDATE ventas.pedidos_clientes SET estado = $1 WHERE id = $2',
      ['IN_PRODUCTION', pedidoId]
    );
    
    await client.query('COMMIT');
    return previaResult.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  crearPedidoDesdeCarrito,
  registrarPago,
  aprobarPago,
  obtenerDetallePedido,
  obtenerPedidosUsuario,
  actualizarEstadoPedido,
  agregarDiseno,
  agregarMensajeChat,
  agregarPrevia,
  aprobarPrevia
};