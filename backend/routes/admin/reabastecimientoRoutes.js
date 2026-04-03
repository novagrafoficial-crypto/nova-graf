// backend/routes/admin/reabastecimientoRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/admin/reabastecimientoController');

router.get('/categorias',                ctrl.getCategorias);
router.get('/subcategorias',             ctrl.getSubcategorias);
router.get('/productos',                 ctrl.getProductos);
router.get('/productos/:id/variantes',   ctrl.getVariantes);
router.get('/productos/:id/ventas',      ctrl.getVentas);   
router.get('/productos/:id/prediccion', ctrl.getPrediccion); 

module.exports = router;