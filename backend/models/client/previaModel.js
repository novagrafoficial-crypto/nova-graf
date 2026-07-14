// backend/models/client/previasModel.js
const pool = require('../../config/db');

/**
 * Obtener todas las previas de un pedido
 */
const obtenerPreviasPorPedido = async (pedidoId) => {
    const query = `
        SELECT 
            id,
            pedido_cliente_id,
            numero_previa,
            imagen_url,
            aprobada,
            rechazada,
            fecha_subida,
            fecha_aprobacion,
            fecha_vista
        FROM ventas.previas_diseno
        WHERE pedido_cliente_id = $1
        ORDER BY numero_previa ASC
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows;
};

/**
 * Obtener una previa específica
 */
const obtenerPrevia = async (pedidoId, numeroPrevia) => {
    const query = `
        SELECT 
            id,
            pedido_cliente_id,
            numero_previa,
            imagen_url,
            aprobada,
            rechazada,
            fecha_subida,
            fecha_aprobacion,
            fecha_vista
        FROM ventas.previas_diseno
        WHERE pedido_cliente_id = $1 AND numero_previa = $2
    `;
    const { rows } = await pool.query(query, [pedidoId, numeroPrevia]);
    return rows[0] || null;
};

/**
 * Crear una nueva previa
 */
const crearPrevia = async (pedidoId, numeroPrevia, imagenUrl) => {
    const query = `
        INSERT INTO ventas.previas_diseno (
            pedido_cliente_id,
            numero_previa,
            imagen_url,
            fecha_subida
        ) VALUES ($1, $2, $3, NOW())
        ON CONFLICT (pedido_cliente_id, numero_previa) 
        DO UPDATE SET 
            imagen_url = $3, 
            fecha_subida = NOW(),
            aprobada = FALSE,
            rechazada = FALSE
        RETURNING *
    `;
    const { rows } = await pool.query(query, [pedidoId, numeroPrevia, imagenUrl]);
    return rows[0];
};

/**
 * Marcar previa como aprobada
 */
const aprobarPrevia = async (pedidoId, numeroPrevia) => {
    const query = `
        UPDATE ventas.previas_diseno 
        SET aprobada = TRUE, 
            fecha_aprobacion = NOW(),
            rechazada = FALSE
        WHERE pedido_cliente_id = $1 AND numero_previa = $2
        RETURNING *
    `;
    const { rows } = await pool.query(query, [pedidoId, numeroPrevia]);
    return rows[0] || null;
};

/**
 * Marcar previa como rechazada
 */
const rechazarPrevia = async (pedidoId, numeroPrevia) => {
    const query = `
        UPDATE ventas.previas_diseno 
        SET rechazada = TRUE
        WHERE pedido_cliente_id = $1 AND numero_previa = $2
        RETURNING *
    `;
    const { rows } = await pool.query(query, [pedidoId, numeroPrevia]);
    return rows[0] || null;
};

/**
 * Marcar previa como vista
 */
const marcarPreviaVista = async (pedidoId, numeroPrevia) => {
    const query = `
        UPDATE ventas.previas_diseno 
        SET fecha_vista = NOW()
        WHERE pedido_cliente_id = $1 AND numero_previa = $2
        RETURNING *
    `;
    const { rows } = await pool.query(query, [pedidoId, numeroPrevia]);
    return rows[0] || null;
};

/**
 * Contar previas rechazadas de un pedido
 */
const contarPreviasRechazadas = async (pedidoId) => {
    const query = `
        SELECT COUNT(*) AS total
        FROM ventas.previas_diseno
        WHERE pedido_cliente_id = $1 AND rechazada = TRUE
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return parseInt(rows[0].total) || 0;
};

/**
 * Verificar si ya hay una previa aprobada
 */
const tienePreviaAprobada = async (pedidoId) => {
    const query = `
        SELECT COUNT(*) AS total
        FROM ventas.previas_diseno
        WHERE pedido_cliente_id = $1 AND aprobada = TRUE
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return parseInt(rows[0].total) > 0;
};

module.exports = {
    obtenerPreviasPorPedido,
    obtenerPrevia,
    crearPrevia,
    aprobarPrevia,
    rechazarPrevia,
    marcarPreviaVista,
    contarPreviasRechazadas,
    tienePreviaAprobada
};