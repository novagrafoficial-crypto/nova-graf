// backend/controllers/client/ofertaController.js
const Descuento = require('../../models/client/Descuento');

// ─── OBTENER TODAS LAS OFERTAS ──────────────────
const getOfertas = async (req, res) => {
  try {
    console.log('📋 Obteniendo todas las ofertas...');
    const ofertas = await Descuento.getOfertasAgrupadas();
    console.log(`✅ ${ofertas.length} ofertas encontradas`);

    res.json({
      success: true,
      data: ofertas
    });
  } catch (error) {
    console.error('❌ Error al obtener ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las ofertas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── OBTENER DETALLE DE UNA OFERTA ──────────────
const getOfertaDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Obteniendo detalle de oferta ID: ${id}`);

    if (isNaN(id) || parseInt(id) <= 0) {
      console.log(`❌ ID inválido: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'ID de oferta inválido'
      });
    }

    const oferta = await Descuento.getOfertaDetalle(id);

    if (!oferta) {
      console.log(`❌ Oferta con ID ${id} no encontrada`);
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    console.log(`✅ Oferta "${oferta.nombre}" encontrada con ${oferta.variantes.length} variantes`);

    res.json({
      success: true,
      data: oferta
    });
  } catch (error) {
    console.error('❌ Error al obtener detalle de oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle de la oferta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── OBTENER OFERTAS POR PRODUCTO ──────────────
const getOfertasByProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    console.log(`📋 Obteniendo ofertas para producto ID: ${productoId}`);

    if (isNaN(productoId) || parseInt(productoId) <= 0) {
      console.log(`❌ ID de producto inválido: ${productoId}`);
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const ofertas = await Descuento.getOfertasByProducto(productoId);
    console.log(`✅ ${ofertas.length} ofertas encontradas para el producto`);

    res.json({
      success: true,
      data: ofertas
    });
  } catch (error) {
    console.error('❌ Error al obtener ofertas del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ofertas del producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getOfertas,
  getOfertaDetalle,
  getOfertasByProducto
};