// backend/routes/client/productosRoutes.js
const express = require('express');
const router  = express.Router();
const {
  mostrarCatalogo,
  mostrarDetalle,
  mostrarCategorias,
  mostrarSubcategorias, // ✅ agregado
  mostrarMarcas,        // ✅ agregado
} = require('../../controllers/client/productosController');

// ⚠️ Rutas con nombre fijo SIEMPRE antes de /:id
router.get('/catalogo',      mostrarCatalogo);
router.get('/categorias',    mostrarCategorias);
router.get('/subcategorias', mostrarSubcategorias); // ✅ agregado
router.get('/marcas',        mostrarMarcas);        // ✅ agregado

// Ruta dinámica al final
router.get('/:id', mostrarDetalle);

module.exports = router;