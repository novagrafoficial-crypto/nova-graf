// backend/controllers/client/previasController.js
const previaModel = require('../../models/client/previaModel');
const pedidoModel = require('../../models/client/pedidoModel');
const notificacionesModel = require('../../models/client/notificacionesModel');
const userModel = require('../../models/public/userModel');

// ─── OBTENER PREVIAS ──────────────────────────────────────────────
const obtenerPrevias = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const usuarioId = req.usuario.id_usuario;

        // Verificar que el pedido pertenece al usuario
        const pedido = await pedidoModel.obtenerPedidoBasicoDeUsuario(pedidoId, usuarioId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        const previas = await previaModel.obtenerPreviasPorPedido(pedidoId);

        res.json({
            success: true,
            previas,
            pedido_estado: pedido.estado
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
        const pedido = await pedidoModel.obtenerPedidoBasicoDeUsuario(pedidoId, usuarioId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Marcar previa como aprobada
        const previa = await previaModel.aprobarPrevia(pedidoId, numero_previa);

        if (!previa) {
            return res.status(404).json({
                success: false,
                message: 'Previa no encontrada'
            });
        }

        // Cambiar estado del pedido a EN_PRODUCCION
        await pedidoModel.actualizarEstadoPedido(pedidoId, 'EN_PRODUCCION');

        // Crear notificación para el propio cliente
        await notificacionesModel.crearNotificacion({
            usuario_id: usuarioId,
            pedido_id: pedidoId,
            tipo: 'ESTADO_CAMBIADO',
            titulo: '🏭 Pedido en producción',
            mensaje: `¡Tu diseño ha sido aprobado! Tu pedido #${pedidoId} está en producción.`,
            enlace: `/cliente/pedido/${pedidoId}`
        });

        res.json({
            success: true,
            message: 'Previa aprobada correctamente',
            previa,
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
        const pedido = await pedidoModel.obtenerPedidoBasicoDeUsuario(pedidoId, usuarioId);

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Marcar previa como rechazada
        const previa = await previaModel.rechazarPrevia(pedidoId, numero_previa);

        if (!previa) {
            return res.status(404).json({
                success: false,
                message: 'Previa no encontrada'
            });
        }

        // Verificar cuántas previas rechazadas tiene
        const rechazadas = await previaModel.contarPreviasRechazadas(pedidoId);

        // Si ya rechazó 2, notificar al admin
        if (rechazadas >= 2) {
            const adminId = await userModel.getAdminId();
            if (adminId) {
                await notificacionesModel.crearNotificacion({
                    usuario_id: adminId,
                    pedido_id: pedidoId,
                    tipo: 'PREVIA_RECHAZADA',
                    titulo: '⚠️ Opciones agotadas',
                    mensaje: `El cliente ha rechazado ambas opciones de diseño para el pedido #${pedidoId}`,
                    enlace: `/admin/pedido/${pedidoId}`
                });
            }
        }

        res.json({
            success: true,
            message: 'Previa rechazada',
            previa,
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