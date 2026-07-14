// models/alexa/pedidosModel.js
const pool = require('../../config/db'); // ← Tu conexión pg existente

class PedidosAlexaModel {

    // ─── OBTENER TODOS (ahora con imagen del primer producto) ───
    static async obtenerTodos(limit = 20) {
        const query = `
            SELECT 
                p.id,
                p.fecha_pedido,
                p.total_general,
                p.estado,
                p.monto_anticipo,
                p.monto_restante,
                p.direccion_envio,
                p.distancia_km_calculada,
                p.codigo_rastreo,
                p.fecha_entrega_estimada,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.correo_electronico,
                u.telefono,
                me.nombre as metodo_entrega,
                me.descripcion as descripcion_entrega,
                mp.nombre as metodo_pago,
                mp.tipo as tipo_pago,
                mp.instrucciones as instrucciones_pago,
                primera_imagen.imagen_url AS imagen
            FROM ventas.pedidos_clientes p
            LEFT JOIN public.usuarios u ON p.usuario_id = u.id_usuario
            LEFT JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
            LEFT JOIN ventas.metodos_pago mp ON p.metodo_pago_id = mp.id
            LEFT JOIN LATERAL (
                SELECT v.imagen_url
                FROM ventas.pedido_cliente_detalle d
                JOIN productos.producto_variantes v ON d.variante_id = v.id
                WHERE d.pedido_cliente_id = p.id
                ORDER BY d.id ASC
                LIMIT 1
            ) primera_imagen ON true
            ORDER BY p.fecha_pedido DESC
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // ─── OBTENER POR ESTADO (con imagen) ─────────────────
    static async obtenerPorEstado(estado) {
        const query = `
            SELECT 
                p.id,
                p.fecha_pedido,
                p.total_general,
                p.estado,
                p.monto_anticipo,
                p.monto_restante,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.correo_electronico,
                primera_imagen.imagen_url AS imagen
            FROM ventas.pedidos_clientes p
            LEFT JOIN public.usuarios u ON p.usuario_id = u.id_usuario
            LEFT JOIN LATERAL (
                SELECT v.imagen_url
                FROM ventas.pedido_cliente_detalle d
                JOIN productos.producto_variantes v ON d.variante_id = v.id
                WHERE d.pedido_cliente_id = p.id
                ORDER BY d.id ASC
                LIMIT 1
            ) primera_imagen ON true
            WHERE p.estado = $1
            ORDER BY p.fecha_pedido DESC
        `;

        const result = await pool.query(query, [estado]);
        return result.rows;
    }

    // ─── OBTENER POR CLIENTE (con imagen) ────────────────
    static async obtenerPorCliente(busqueda) {
        const query = `
            SELECT 
                p.id,
                p.fecha_pedido,
                p.total_general,
                p.estado,
                p.monto_anticipo,
                p.monto_restante,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.correo_electronico,
                primera_imagen.imagen_url AS imagen
            FROM ventas.pedidos_clientes p
            LEFT JOIN public.usuarios u ON p.usuario_id = u.id_usuario
            LEFT JOIN LATERAL (
                SELECT v.imagen_url
                FROM ventas.pedido_cliente_detalle d
                JOIN productos.producto_variantes v ON d.variante_id = v.id
                WHERE d.pedido_cliente_id = p.id
                ORDER BY d.id ASC
                LIMIT 1
            ) primera_imagen ON true
            WHERE u.nombre ILIKE $1 
               OR u.apellido_paterno ILIKE $1
               OR u.correo_electronico ILIKE $1
            ORDER BY p.fecha_pedido DESC
        `;

        const result = await pool.query(query, [`%${busqueda}%`]);
        return result.rows;
    }

    // ─── OBTENER POR FECHA (con imagen) ──────────────────
    static async obtenerPorFecha(fecha) {
        const query = `
            SELECT 
                p.id,
                p.fecha_pedido,
                p.total_general,
                p.estado,
                p.monto_anticipo,
                p.monto_restante,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                primera_imagen.imagen_url AS imagen
            FROM ventas.pedidos_clientes p
            LEFT JOIN public.usuarios u ON p.usuario_id = u.id_usuario
            LEFT JOIN LATERAL (
                SELECT v.imagen_url
                FROM ventas.pedido_cliente_detalle d
                JOIN productos.producto_variantes v ON d.variante_id = v.id
                WHERE d.pedido_cliente_id = p.id
                ORDER BY d.id ASC
                LIMIT 1
            ) primera_imagen ON true
            WHERE DATE(p.fecha_pedido) = DATE($1)
            ORDER BY p.fecha_pedido DESC
        `;

        const result = await pool.query(query, [fecha]);
        return result.rows;
    }

    // ─── OBTENER DETALLE COMPLETO (ya traía imagen_url, sin cambios) ────
    static async obtenerDetalleCompleto(id) {
        const queryPedido = `
            SELECT 
                p.*,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.correo_electronico,
                u.telefono,
                u.domicilio,
                me.nombre as metodo_entrega,
                me.descripcion as descripcion_entrega,
                mp.nombre as metodo_pago,
                mp.tipo as tipo_pago,
                mp.descripcion as descripcion_pago,
                mp.instrucciones as instrucciones_pago,
                mp.datos_bancarios
            FROM ventas.pedidos_clientes p
            LEFT JOIN public.usuarios u ON p.usuario_id = u.id_usuario
            LEFT JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
            LEFT JOIN ventas.metodos_pago mp ON p.metodo_pago_id = mp.id
            WHERE p.id = $1
        `;

        const resultPedido = await pool.query(queryPedido, [id]);
        if (resultPedido.rows.length === 0) return null;
        const pedido = resultPedido.rows[0];

        const queryProductos = `
            SELECT 
                d.cantidad,
                d.precio_unitario,
                d.variante_id,
                v.imagen_url,
                v.sku,
                pr.nombre as producto_nombre,
                pr.descripcion as producto_descripcion,
                c.nombre as categoria_nombre
            FROM ventas.pedido_cliente_detalle d
            LEFT JOIN productos.producto_variantes v ON d.variante_id = v.id
            LEFT JOIN productos.productos pr ON v.producto_id = pr.id
            LEFT JOIN productos.categorias c ON pr.categoria_id = c.id
            WHERE d.pedido_cliente_id = $1
        `;

        const resultProductos = await pool.query(queryProductos, [id]);

        const queryPagos = `
            SELECT 
                id,
                tipo_pago,
                monto,
                comprobante_url,
                estado_pago,
                notas_admin,
                fecha_pago
            FROM ventas.pagos_pedidos
            WHERE pedido_cliente_id = $1
            ORDER BY fecha_pago DESC
        `;

        const resultPagos = await pool.query(queryPagos, [id]);

        return {
            pedido,
            detalles: resultProductos.rows || [],
            pagos: resultPagos.rows || []
        };
    }

    // ─── ACTUALIZAR ESTADO ───────────────────────────────
    static async actualizarEstado(id, nuevoEstado) {
        const query = `
            UPDATE ventas.pedidos_clientes 
            SET estado = $1
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [nuevoEstado, id]);
        return result.rows[0] || null;
    }

    // ─── OBTENER ESTADÍSTICAS ────────────────────────────
    static async obtenerEstadisticas() {
        const query = `
            SELECT estado, COUNT(*) as cantidad
            FROM ventas.pedidos_clientes
            GROUP BY estado
            ORDER BY cantidad DESC
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    // ─── OBTENER ÚLTIMOS POR ESTADO (con imagen) ─────────
    static async obtenerUltimosPorEstado(estado, limit = 5) {
        const query = `
            SELECT 
                p.id,
                p.fecha_pedido,
                p.total_general,
                p.estado,
                p.monto_anticipo,
                p.monto_restante,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                primera_imagen.imagen_url AS imagen
            FROM ventas.pedidos_clientes p
            LEFT JOIN public.usuarios u ON p.usuario_id = u.id_usuario
            LEFT JOIN LATERAL (
                SELECT v.imagen_url
                FROM ventas.pedido_cliente_detalle d
                JOIN productos.producto_variantes v ON d.variante_id = v.id
                WHERE d.pedido_cliente_id = p.id
                ORDER BY d.id ASC
                LIMIT 1
            ) primera_imagen ON true
            WHERE p.estado = $1
            ORDER BY p.fecha_pedido DESC
            LIMIT $2
        `;

        const result = await pool.query(query, [estado, limit]);
        return result.rows;
    }
}

module.exports = PedidosAlexaModel;