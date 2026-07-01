// backend/models/client/notificacionesModel.js
const pool = require('../../config/db');

/**
 * Obtener todas las notificaciones del usuario
 */
const obtenerNotificaciones = async (usuarioId) => {
    const query = `
        SELECT 
            id,
            pedido_id,
            tipo,
            titulo,
            mensaje,
            leida,
            creado_en,
            enlace
        FROM ventas.notificaciones
        WHERE usuario_id = $1
        ORDER BY creado_en DESC
        LIMIT 50
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
};

/**
 * Obtener número de notificaciones no leídas
 */
const obtenerNoLeidas = async (usuarioId) => {
    const query = `
        SELECT COUNT(*) AS total
        FROM ventas.notificaciones
        WHERE usuario_id = $1 AND leida = FALSE
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return parseInt(rows[0].total) || 0;
};

/**
 * Marcar notificación como leída
 */
const marcarComoLeida = async (notificacionId, usuarioId) => {
    const query = `
        UPDATE ventas.notificaciones
        SET leida = TRUE, leida_en = NOW()
        WHERE id = $1 AND usuario_id = $2
        RETURNING *
    `;
    const { rows } = await pool.query(query, [notificacionId, usuarioId]);
    return rows[0] || null;
};

/**
 * Marcar todas las notificaciones como leídas
 */
const marcarTodasComoLeidas = async (usuarioId) => {
    const query = `
        UPDATE ventas.notificaciones
        SET leida = TRUE, leida_en = NOW()
        WHERE usuario_id = $1 AND leida = FALSE
        RETURNING *
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
};

/**
 * Eliminar una notificación
 */
const eliminarNotificacion = async (notificacionId, usuarioId) => {
    const query = `
        DELETE FROM ventas.notificaciones
        WHERE id = $1 AND usuario_id = $2
        RETURNING id
    `;
    const { rows } = await pool.query(query, [notificacionId, usuarioId]);
    return rows[0] || null;
};

module.exports = {
    obtenerNotificaciones,
    obtenerNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion
};