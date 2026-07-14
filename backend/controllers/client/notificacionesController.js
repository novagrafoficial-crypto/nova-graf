// backend/controllers/client/notificacionesController.js
const notificacionesModel = require('../../models/client/notificacionesModel');

/**
 * Obtener todas las notificaciones del usuario
 * GET /api/client/notificaciones
 */
const obtenerNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.usuario.id_usuario;
        const notificaciones = await notificacionesModel.obtenerNotificaciones(usuarioId);
        const noLeidas = await notificacionesModel.obtenerNoLeidas(usuarioId);
        
        res.json({
            success: true,
            notificaciones,
            noLeidas
        });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener notificaciones' 
        });
    }
};

/**
 * Obtener conteo de notificaciones no leídas
 * GET /api/client/notificaciones/no-leidas
 */
const obtenerNoLeidas = async (req, res) => {
    try {
        const usuarioId = req.usuario.id_usuario;
        const total = await notificacionesModel.obtenerNoLeidas(usuarioId);
        res.json({ 
            success: true, 
            noLeidas: total 
        });
    } catch (error) {
        console.error('Error al obtener no leídas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener no leídas' 
        });
    }
};

/**
 * Marcar notificación como leída
 * PUT /api/client/notificaciones/:id/leer
 */
const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id_usuario;
        
        const notificacion = await notificacionesModel.marcarComoLeida(id, usuarioId);
        
        if (!notificacion) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notificación no encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Notificación marcada como leída',
            notificacion 
        });
    } catch (error) {
        console.error('Error al marcar como leída:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al marcar como leída' 
        });
    }
};

/**
 * Marcar todas como leídas
 * PUT /api/client/notificaciones/leer-todas
 */
const marcarTodasComoLeidas = async (req, res) => {
    try {
        const usuarioId = req.usuario.id_usuario;
        const actualizadas = await notificacionesModel.marcarTodasComoLeidas(usuarioId);
        
        res.json({ 
            success: true, 
            message: 'Todas las notificaciones marcadas como leídas',
            total: actualizadas.length
        });
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al marcar todas como leídas' 
        });
    }
};

/**
 * Eliminar notificación
 * DELETE /api/client/notificaciones/:id
 */
const eliminarNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id_usuario;
        
        const eliminada = await notificacionesModel.eliminarNotificacion(id, usuarioId);
        
        if (!eliminada) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notificación no encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Notificación eliminada' 
        });
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar notificación' 
        });
    }
};

module.exports = {
    obtenerNotificaciones,
    obtenerNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion
};