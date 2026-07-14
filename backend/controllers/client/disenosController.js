// backend/controllers/client/disenosController.js
const disenoModel = require('../../models/client/disenoModel');

/**
 * Obtener todos los diseños del cliente
 * GET /api/client/disenos
 */
const obtenerDisenosCliente = async (req, res) => {
    try {
        const usuarioId = req.usuario.id_usuario;
        const disenos = await disenoModel.obtenerDisenosCliente(usuarioId);
        
        res.json({
            success: true,
            disenos
        });
    } catch (error) {
        console.error('Error al obtener diseños:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener diseños' 
        });
    }
};

/**
 * Obtener detalle de un diseño
 * GET /api/client/disenos/:id
 */
const obtenerDisenoDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id_usuario;
        
        const diseno = await disenoModel.obtenerDisenoPorId(id, usuarioId);
        
        if (!diseno) {
            return res.status(404).json({ 
                success: false, 
                message: 'Diseño no encontrado' 
            });
        }
        
        res.json({
            success: true,
            diseno
        });
    } catch (error) {
        console.error('Error al obtener detalle del diseño:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener detalle del diseño' 
        });
    }
};

module.exports = {
    obtenerDisenosCliente,
    obtenerDisenoDetalle
};