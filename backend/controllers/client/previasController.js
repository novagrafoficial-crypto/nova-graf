// backend/controllers/client/previasController.js
const pool = require('../../config/db');

// ─── OBTENER PREVIAS ──────────────────────────────────────────────
const obtenerPrevias = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const usuarioId = req.usuario.id_usuario;

        // Verificar que el pedido pertenece al usuario
        const pedidoCheck = await pool.query(
            'SELECT id, estado FROM ventas.pedidos_clientes WHERE id = $1 AND usuario_id = $2',
            [pedidoId, usuarioId]
        );
        
        if (pedidoCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        const query = `
            SELECT 
                id,
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

        res.json({
            success: true,
            previas: rows,
            pedido_estado: pedidoCheck.rows[0].estado
        });

    } catch (error) {
        console.error('Error al obtener previas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener previas' 
        });
    }
};

// ─── APROBAR PREVIA ─────────────────────────────────────────────────
const aprobarPrevia = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const { numero_previa } = req.body;
        const usuarioId = req.usuario.id_usuario;

        // Verificar que el pedido pertenece al usuario
        const pedidoCheck = await pool.query(
            'SELECT id, estado FROM ventas.pedidos_clientes WHERE id = $1 AND usuario_id = $2',
            [pedidoId, usuarioId]
        );
        
        if (pedidoCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // Marcar previa como aprobada
        const query = `
            UPDATE ventas.previas_diseno 
            SET aprobada = TRUE, fecha_aprobacion = NOW()
            WHERE pedido_cliente_id = $1 AND numero_previa = $2
            RETURNING *
        `;
        const { rows } = await pool.query(query, [pedidoId, numero_previa]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Previa no encontrada' 
            });
        }

        // Cambiar estado del pedido a EN_PRODUCCION
        await pool.query(
            `UPDATE ventas.pedidos_clientes SET estado = 'EN_PRODUCCION' WHERE id = $1`,
            [pedidoId]
        );

        // Crear notificación
        await pool.query(
            `INSERT INTO ventas.notificaciones (usuario_id, pedido_id, tipo, titulo, mensaje, enlace)
             VALUES (
                 (SELECT usuario_id FROM ventas.pedidos_clientes WHERE id = $1),
                 $1,
                 'ESTADO_CAMBIADO',
                 '🏭 Pedido en producción',
                 '¡Tu diseño ha sido aprobado! Tu pedido #' || $1 || ' está en producción.',
                 '/cliente/pedido/' || $1
             )`,
            [pedidoId]
        );

        res.json({
            success: true,
            message: 'Previa aprobada correctamente',
            previa: rows[0],
            nuevo_estado: 'EN_PRODUCCION'
        });

    } catch (error) {
        console.error('Error al aprobar previa:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al aprobar previa' 
        });
    }
};

// ─── RECHAZAR PREVIA ──────────────────────────────────────────────
const rechazarPrevia = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const { numero_previa } = req.body;
        const usuarioId = req.usuario.id_usuario;

        // Verificar que el pedido pertenece al usuario
        const pedidoCheck = await pool.query(
            'SELECT id, estado FROM ventas.pedidos_clientes WHERE id = $1 AND usuario_id = $2',
            [pedidoId, usuarioId]
        );
        
        if (pedidoCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // Marcar previa como rechazada
        const query = `
            UPDATE ventas.previas_diseno 
            SET rechazada = TRUE
            WHERE pedido_cliente_id = $1 AND numero_previa = $2
            RETURNING *
        `;
        const { rows } = await pool.query(query, [pedidoId, numero_previa]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Previa no encontrada' 
            });
        }

        // Verificar cuántas previas rechazadas tiene
        const countQuery = `
            SELECT COUNT(*) FROM ventas.previas_diseno 
            WHERE pedido_cliente_id = $1 AND rechazada = TRUE
        `;
        const countResult = await pool.query(countQuery, [pedidoId]);
        const rechazadas = parseInt(countResult.rows[0].count);

        // Si ya rechazó 2, notificar al admin
        if (rechazadas >= 2) {
            await pool.query(
                `INSERT INTO ventas.notificaciones (usuario_id, pedido_id, tipo, titulo, mensaje, enlace)
                 VALUES (
                     (SELECT id_usuario FROM public.usuarios WHERE rol = 'admin' LIMIT 1),
                     $1,
                     'PREVIA_RECHAZADA',
                     '⚠️ Opciones agotadas',
                     'El cliente ha rechazado ambas opciones de diseño para el pedido #' || $1,
                     '/admin/pedido/' || $1
                 )`,
                [pedidoId]
            );
        }

        res.json({
            success: true,
            message: 'Previa rechazada',
            previa: rows[0],
            rechazadas_total: rechazadas
        });

    } catch (error) {
        console.error('Error al rechazar previa:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al rechazar previa' 
        });
    }
};

module.exports = {
    obtenerPrevias,
    aprobarPrevia,
    rechazarPrevia
};