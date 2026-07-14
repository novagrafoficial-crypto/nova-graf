// backend/controllers/client/portafolioController.js
const portafolioModel = require('../../models/client/portafolioModel');

/**
 * Obtener todos los productos del portafolio
 * GET /api/client/portafolio
 */
const obtenerPortafolio = async (req, res) => {
    try {
        const portafolio = await portafolioModel.obtenerPortafolio();
        res.json({
            success: true,
            portafolio
        });
    } catch (error) {
        console.error('Error al obtener portafolio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener portafolio' 
        });
    }
};

/**
 * Obtener detalle de un producto del portafolio
 * GET /api/client/portafolio/:id
 */
const obtenerPortafolioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const portafolio = await portafolioModel.obtenerPortafolioPorId(id);
        
        if (!portafolio) {
            return res.status(404).json({ 
                success: false, 
                message: 'Producto no encontrado en el portafolio' 
            });
        }
        
        res.json({
            success: true,
            portafolio
        });
    } catch (error) {
        console.error('Error al obtener portafolio:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener portafolio' 
        });
    }
};

/**
 * Obtener portafolio por producto
 * GET /api/client/portafolio/producto/:productoId
 */
const obtenerPortafolioPorProducto = async (req, res) => {
    try {
        const { productoId } = req.params;
        const portafolio = await portafolioModel.obtenerPortafolioPorProducto(productoId);
        res.json({
            success: true,
            portafolio
        });
    } catch (error) {
        console.error('Error al obtener portafolio por producto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener portafolio por producto' 
        });
    }
};

module.exports = {
    obtenerPortafolio,
    obtenerPortafolioPorId,
    obtenerPortafolioPorProducto
};