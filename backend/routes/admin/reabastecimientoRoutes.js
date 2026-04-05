// backend/routes/admin/reabastecimientoRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../../controllers/admin/reabastecimientoController');

router.get('/categorias',                ctrl.getCategorias);
router.get('/subcategorias',             ctrl.getSubcategorias);
router.get('/productos',                 ctrl.getProductos);
router.get('/productos/:id/variantes',   ctrl.getVariantes);
router.get('/productos/:id/ventas',      ctrl.getVentas);   
router.get('/productos/:id/prediccion',  ctrl.getPrediccion); 
router.get('/prediccion',                ctrl.getPrediccionGeneral);

router.get('/variante/:varianteId/ventas', async (req, res) => {
try {
       const data = await model.getVentasByVariante(req.params.varianteId);
       res.json(data);
     } catch (err) {
       console.error(err.message);
       res.status(500).json({ error: 'Error al obtener ventas de variante.' });
     }
   });


module.exports = router;