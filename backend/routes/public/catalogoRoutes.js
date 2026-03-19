const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/public/catalogoController');

router.get('/categorias',    ctrl.getCategorias);
router.get('/filtros',       ctrl.getFiltros);
router.get('/productos',     ctrl.getProductos);
router.get('/productos/:id', ctrl.getDetalle);

module.exports = router;