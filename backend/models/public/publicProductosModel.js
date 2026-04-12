// backend/models/public/publicProductosModel.js
const {
  getProductosCatalogo,
  getProductoDetalle,
  getCategorias,
  getSubcategorias,
  getMarcas,
  getPortafolioByProducto,
} = require('../client/productosModel');

module.exports = {
  getProductosCatalogo,
  getProductoDetalle,
  getCategorias,
  getSubcategorias,
  getMarcas,
  getPortafolioByProducto,
};