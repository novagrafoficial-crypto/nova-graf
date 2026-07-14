// backend/models/client/disenoModel.js
const pool = require('../../config/db');

/**
 * Guardar diseño del cliente
 */
const guardarDiseno = async (pedidoId, tipoOrigen, archivoUrl, simuladorJson, notasCliente) => {
    const query = `
        INSERT INTO ventas.disenos_clientes (
            pedido_cliente_id,
            tipo_origen,
            archivo_url,
            simulador_json,
            notas_cliente,
            fecha_envio
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
    `;
    const values = [pedidoId, tipoOrigen, archivoUrl, simuladorJson, notasCliente];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

/**
 * Obtener diseños de un pedido
 */
const obtenerDisenosPorPedido = async (pedidoId) => {
    const query = `
        SELECT 
            id,
            tipo_origen,
            archivo_url,
            simulador_json,
            notas_cliente,
            fecha_envio
        FROM ventas.disenos_clientes
        WHERE pedido_cliente_id = $1
        ORDER BY fecha_envio DESC
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows;
};

/**
 * Obtener el último diseño de un pedido
 */
const obtenerUltimoDiseno = async (pedidoId) => {
    const query = `
        SELECT 
            id,
            tipo_origen,
            archivo_url,
            simulador_json,
            notas_cliente,
            fecha_envio
        FROM ventas.disenos_clientes
        WHERE pedido_cliente_id = $1
        ORDER BY fecha_envio DESC
        LIMIT 1
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows[0] || null;
};

const obtenerDisenosCliente = async (usuarioId) => {
    const query = `
        SELECT 
            d.id,
            d.pedido_cliente_id,
            d.tipo_origen,
            d.archivo_url,
            d.simulador_json,
            d.notas_cliente,
            d.fecha_envio,
            p.id AS pedido_id,
            p.estado AS pedido_estado,
            p.total_general,
            (SELECT COUNT(*) FROM ventas.previas_diseno WHERE pedido_cliente_id = p.id) AS total_previas,
            (SELECT COUNT(*) FROM ventas.previas_diseno WHERE pedido_cliente_id = p.id AND aprobada = true) AS previas_aprobadas
        FROM ventas.disenos_clientes d
        JOIN ventas.pedidos_clientes p ON d.pedido_cliente_id = p.id
        WHERE p.usuario_id = $1
        ORDER BY d.fecha_envio DESC
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
};


const obtenerDisenoPorId = async (disenoId, usuarioId) => {
    const query = `
        SELECT 
            d.*,
            p.id AS pedido_id,
            p.estado AS pedido_estado,
            p.total_general,
            (
                SELECT json_agg(
                    json_build_object(
                        'id', pd.id,
                        'numero_previa', pd.numero_previa,
                        'imagen_url', pd.imagen_url,
                        'aprobada', pd.aprobada,
                        'fecha_subida', pd.fecha_subida,
                        'fecha_aprobacion', pd.fecha_aprobacion
                    ) ORDER BY pd.numero_previa ASC
                )
                FROM ventas.previas_diseno pd
                WHERE pd.pedido_cliente_id = p.id
            ) AS previas
        FROM ventas.disenos_clientes d
        JOIN ventas.pedidos_clientes p ON d.pedido_cliente_id = p.id
        WHERE d.id = $1 AND p.usuario_id = $2
    `;
    const { rows } = await pool.query(query, [disenoId, usuarioId]);
    return rows[0] || null;
};

module.exports = {
    guardarDiseno,
    obtenerDisenosPorPedido,
    obtenerUltimoDiseno,
    obtenerDisenosCliente,
    obtenerDisenoPorId
};