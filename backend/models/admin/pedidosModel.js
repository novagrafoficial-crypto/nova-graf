const db = require('../../config/db');

const obtenerTodos = async () => {
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.fecha_pedido,
        p.estado,
        p.total_general,
        p.monto_anticipo,
        p.monto_restante,
        p.direccion_envio,
        u.nombre AS cliente_nombre,
        u.correo_electronico AS cliente_correo,
        me.nombre AS metodo_entrega,
        mp.nombre AS metodo_pago
      FROM ventas.pedidos_clientes p
      JOIN public.usuarios u ON p.usuario_id = u.id_usuario
      LEFT JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
      LEFT JOIN ventas.metodos_pago mp ON p.metodo_pago_id = mp.id
      ORDER BY p.fecha_pedido DESC
    `);
    return result.rows;
  } catch (err) {
    console.error('❌ Error en obtenerTodos pedidos:', err.message);
    throw err;
  }
};

const obtenerPorId = async (id) => {
  const pedido = await db.query(`
    SELECT 
      p.*,
      u.nombre AS cliente_nombre,
      u.correo_electronico AS cliente_correo,
      me.nombre AS metodo_entrega,
      mp.nombre AS metodo_pago
    FROM ventas.pedidos_clientes p
    JOIN public.usuarios u ON p.usuario_id = u.id_usuario
    LEFT JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
    LEFT JOIN ventas.metodos_pago mp ON p.metodo_pago_id = mp.id
    WHERE p.id = $1
  `, [id]);

  const detalle = await db.query(`
    SELECT 
      d.cantidad,
      d.precio_unitario,
      pv.sku,
      pr.nombre AS producto_nombre
    FROM ventas.pedido_cliente_detalle d
    JOIN productos.producto_variantes pv ON d.variante_id = pv.id
    JOIN productos.productos pr ON pv.producto_id = pr.id
    WHERE d.pedido_cliente_id = $1
  `, [id]);

  const pagos = await db.query(`
    SELECT * FROM ventas.pagos_pedidos 
    WHERE pedido_cliente_id = $1 
    ORDER BY fecha_pago DESC
  `, [id]);

  const previas = await db.query(`
    SELECT * FROM ventas.previas_diseno 
    WHERE pedido_cliente_id = $1 
    ORDER BY numero_previa ASC
  `, [id]);

  const chat = await db.query(`
    SELECT c.*, u.nombre AS remitente_nombre
    FROM ventas.chat_pedidos c
    JOIN public.usuarios u ON c.remitente_id = u.id_usuario
    WHERE c.pedido_cliente_id = $1
    ORDER BY c.fecha_envio ASC
  `, [id]);

  return {
    pedido: pedido.rows[0],
    detalle: detalle.rows,
    pagos: pagos.rows,
    previas: previas.rows,
    chat: chat.rows,
  };
};

const actualizarEstado = async (id, estado) => {
  const result = await db.query(
    `UPDATE ventas.pedidos_clientes SET estado = $1 WHERE id = $2 RETURNING *`,
    [estado, id]
  );
  if (result.rowCount === 0) throw new Error('Pedido no encontrado');
  return result.rows[0];
};

const actualizarPago = async (id, estado_pago, notas_admin) => {
  const result = await db.query(
    `UPDATE ventas.pagos_pedidos SET estado_pago = $1, notas_admin = $2 WHERE id = $3 RETURNING *`,
    [estado_pago, notas_admin, id]
  );
  if (result.rowCount === 0) throw new Error('Pago no encontrado');
  return result.rows[0];
};

const subirPrevia = async (pedido_cliente_id, numero_previa, imagen_url) => {
  const result = await db.query(`
    INSERT INTO ventas.previas_diseno (pedido_cliente_id, numero_previa, imagen_url)
    VALUES ($1, $2, $3) RETURNING *
  `, [pedido_cliente_id, numero_previa, imagen_url]);
  return result.rows[0];
};

const enviarMensaje = async (pedido_cliente_id, remitente_id, mensaje) => {
  const result = await db.query(`
    INSERT INTO ventas.chat_pedidos (pedido_cliente_id, remitente_id, mensaje)
    VALUES ($1, $2, $3) RETURNING *
  `, [pedido_cliente_id, remitente_id, mensaje]);
  return result.rows[0];
};

module.exports = { obtenerTodos, obtenerPorId, actualizarEstado, actualizarPago, subirPrevia, enviarMensaje };