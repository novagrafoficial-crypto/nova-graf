// backend/controllers/client/chatController.js
const pool = require('../../config/db'); // ← AGREGAR ESTA LÍNEA
const chatModel = require('../../models/client/chatModel');

// ─── ENVIAR MENSAJE ──────────────────────────────────────────────
const enviarMensaje = async (req, res) => {
    try {
        const { id } = req.params; // pedido_id
        const { mensaje } = req.body;
        const usuarioId = req.usuario.id_usuario;

        console.log('📝 Enviando mensaje:', { pedidoId: id, usuarioId, mensaje });

        if (!mensaje || mensaje.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'El mensaje no puede estar vacío' 
            });
        }

        // Verificar que el pedido existe y pertenece al usuario
        const pedidoCheck = await pool.query(
            'SELECT id, estado, usuario_id FROM ventas.pedidos_clientes WHERE id = $1',
            [id]
        );
        
        console.log('📦 Pedido encontrado:', pedidoCheck.rows[0]);

        if (pedidoCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // Verificar que el usuario tiene acceso al pedido (es dueño o es admin)
        const pedido = pedidoCheck.rows[0];
        const esAdmin = req.usuario.rol === 'admin';
        
        if (!esAdmin && pedido.usuario_id !== usuarioId) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes acceso a este pedido' 
            });
        }

        // Guardar mensaje
        const chat = await chatModel.enviarMensaje(id, usuarioId, mensaje);

        // Crear notificación para el otro usuario
        if (esAdmin) {
            // Si es admin, notificar al cliente
            await pool.query(
                `INSERT INTO ventas.notificaciones (usuario_id, pedido_id, tipo, titulo, mensaje, enlace)
                 VALUES ($1, $2, 'MENSAJE_NUEVO', '💬 Nuevo mensaje del administrador', 
                 'El administrador te ha enviado un mensaje sobre tu pedido #' || $2,
                 '/cliente/pedido/' || $2)`,
                [pedido.usuario_id, id]
            );
        } else {
            // Si es cliente, notificar al admin (usuario_id = 1 o el que corresponda)
            const adminCheck = await pool.query(
                'SELECT id_usuario FROM public.usuarios WHERE rol = $1 LIMIT 1',
                ['admin']
            );
            if (adminCheck.rows.length > 0) {
                await pool.query(
                    `INSERT INTO ventas.notificaciones (usuario_id, pedido_id, tipo, titulo, mensaje, enlace)
                     VALUES ($1, $2, 'MENSAJE_NUEVO', '💬 Nuevo mensaje del cliente', 
                     'El cliente ha enviado un mensaje sobre el pedido #' || $2,
                     '/admin/pedido/' || $2)`,
                    [adminCheck.rows[0].id_usuario, id]
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado',
            chat
        });

    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al enviar mensaje: ' + error.message 
        });
    }
};

// ─── OBTENER MENSAJES ─────────────────────────────────────────────
const obtenerMensajes = async (req, res) => {
    try {
        const { id } = req.params; // pedido_id
        const usuarioId = req.usuario.id_usuario;

        console.log('📥 Obteniendo mensajes del pedido:', id);

        // Verificar que el pedido existe
        const pedidoCheck = await pool.query(
            'SELECT id, usuario_id FROM ventas.pedidos_clientes WHERE id = $1',
            [id]
        );
        
        if (pedidoCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // Verificar acceso
        const pedido = pedidoCheck.rows[0];
        const esAdmin = req.usuario.rol === 'admin';
        
        if (!esAdmin && pedido.usuario_id !== usuarioId) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes acceso a este pedido' 
            });
        }

        const mensajes = await chatModel.obtenerMensajes(id);
        
        // Marcar mensajes como leídos (si no son del usuario actual)
        await chatModel.marcarLeidos(id, usuarioId);

        res.json({
            success: true,
            mensajes
        });

    } catch (error) {
        console.error('❌ Error al obtener mensajes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener mensajes: ' + error.message 
        });
    }
};

module.exports = {
    enviarMensaje,
    obtenerMensajes
};