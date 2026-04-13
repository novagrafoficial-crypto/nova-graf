// backend/routes/public/productosRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/public/publicProductosController');

router.get('/catalogo', controller.getCatalogo);
router.get('/categorias', controller.getCategorias);
router.get('/subcategorias', controller.getSubcategorias);
router.get('/marcas', controller.getMarcas);
router.get('/:id', controller.getDetalle);
router.get('/:productoId/portafolio', controller.getPortafolio);

module.exports = router;