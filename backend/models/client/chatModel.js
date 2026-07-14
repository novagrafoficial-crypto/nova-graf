// backend/models/client/chatModel.js
const pool = require('../../config/db');

// ─── ENVIAR MENSAJE ──────────────────────────────────────────────
const enviarMensaje = async (pedidoId, remitenteId, mensaje) => {
    const query = `
        INSERT INTO ventas.chat_pedidos (
            pedido_cliente_id,
            remitente_id,
            mensaje,
            fecha_envio
        ) VALUES ($1, $2, $3, NOW())
        RETURNING *
    `;
    const values = [pedidoId, remitenteId, mensaje];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// ─── OBTENER MENSAJES ─────────────────────────────────────────────
const obtenerMensajes = async (pedidoId) => {
    const query = `
        SELECT 
            cp.id,
            cp.mensaje,
            cp.leido,
            cp.fecha_envio,
            cp.remitente_id,
            u.nombre AS remitente_nombre,
            u.rol AS remitente_rol
        FROM ventas.chat_pedidos cp
        JOIN public.usuarios u ON cp.remitente_id = u.id_usuario
        WHERE cp.pedido_cliente_id = $1
        ORDER BY cp.fecha_envio ASC
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows;
};

// ─── MARCAR MENSAJES COMO LEÍDOS ──────────────────────────────────
const marcarLeidos = async (pedidoId, usuarioId) => {
    const query = `
        UPDATE ventas.chat_pedidos
        SET leido = TRUE
        WHERE pedido_cliente_id = $1 AND remitente_id != $2 AND leido = FALSE
    `;
    await pool.query(query, [pedidoId, usuarioId]);
};

module.exports = {
    enviarMensaje,
    obtenerMensajes,
    marcarLeidos
};