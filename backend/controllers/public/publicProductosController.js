// backend/controllers/public/publicProductosController.js
const model = require('../../models/public/publicProductosModel');

// GET /api/public/productos/catalogo
const getCatalogo = async (req, res) => {
  try {
    const productos = await model.getProductosCatalogo();
    res.json(productos);
  } catch (error) {
    console.error('Error en catálogo público:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// GET /api/public/productos/:id
const getDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const detalle = await model.getProductoDetalle(id);
    if (!detalle.length) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(detalle);
  } catch (error) {
    console.error('Error en detalle público:', error);
    res.status(500).json({ error: 'Error al obtener detalle' });
  }
};

// GET /api/public/productos/categorias
const getCategorias = async (req, res) => {
  try {
    const categorias = await model.getCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// GET /api/public/productos/subcategorias
const getSubcategorias = async (req, res) => {
  try {
    const subcategorias = await model.getSubcategorias();
    res.json(subcategorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
};

// GET /api/public/productos/marcas
const getMarcas = async (req, res) => {
  try {
    const marcas = await model.getMarcas();
    res.json(marcas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
};

// GET /api/public/productos/:productoId/portafolio
const getPortafolio = async (req, res) => {
  try {
    const { productoId } = req.params;
    const portafolio = await model.getPortafolioByProducto(productoId);
    res.json(portafolio);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener portafolio' });
  }
};

module.exports = {
  getCatalogo,
  getDetalle,
  getCategorias,
  getSubcategorias,
  getMarcas,
  getPortafolio,
};