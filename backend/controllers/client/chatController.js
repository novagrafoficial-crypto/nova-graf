// backend/controllers/client/chatController.js
const chatModel = require('../../models/client/chatModel');
const pedidoModel = require('../../models/client/pedidoModel');
const notificacionesModel = require('../../models/client/notificacionesModel');
const userModel = require('../../models/public/userModel');

// ─── ENVIAR MENSAJE ──────────────────────────────────────────────
const enviarMensaje = async (req, res) => {
    try {
        const { id } = req.params; // pedido_id
        const { mensaje } = req.body;
        const usuarioId = req.usuario.id_usuario;

        if (!mensaje || mensaje.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'El mensaje no puede estar vacío' 
            });
        }

        // Verificar que el pedido existe
        const pedido = await pedidoModel.obtenerPedidoBasico(id);

        if (!pedido) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // Verificar que el usuario tiene acceso al pedido (es dueño o es admin)
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
            await notificacionesModel.crearNotificacion({
                usuario_id: pedido.usuario_id,
                pedido_id: id,
                tipo: 'MENSAJE_NUEVO',
                titulo: '💬 Nuevo mensaje del administrador',
                mensaje: `El administrador te ha enviado un mensaje sobre tu pedido #${id}`,
                enlace: `/cliente/pedido/${id}`
            });
        } else {
            // Si es cliente, notificar al admin
            const adminId = await userModel.getAdminId();
            if (adminId) {
                await notificacionesModel.crearNotificacion({
                    usuario_id: adminId,
                    pedido_id: id,
                    tipo: 'MENSAJE_NUEVO',
                    titulo: '💬 Nuevo mensaje del cliente',
                    mensaje: `El cliente ha enviado un mensaje sobre el pedido #${id}`,
                    enlace: `/admin/pedido/${id}`
                });
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

        // Verificar que el pedido existe
        const pedido = await pedidoModel.obtenerPedidoBasico(id);

        if (!pedido) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // Verificar acceso
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