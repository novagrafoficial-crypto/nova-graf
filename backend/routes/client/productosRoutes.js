// backend/routes/client/productosRoutes.js
const express = require('express');
const router  = express.Router();
const {
  mostrarCatalogo,
  mostrarDetalle,
  mostrarCategorias,
  mostrarSubcategorias, // ✅ agregado
  mostrarMarcas,        // ✅ agregado
  crearProductoPersonalizado,
  mostrarPortafolioPorProducto,
} = require('../../controllers/client/productosController');
const verificarToken = require('../../src/middlewares/auth'); // <-- añadir

// ⚠️ Rutas con nombre fijo SIEMPRE antes de /:id
router.get('/catalogo',      mostrarCatalogo);
router.get('/categorias',    mostrarCategorias);
router.get('/subcategorias', mostrarSubcategorias); // ✅ agregado
router.get('/marcas',        mostrarMarcas);        // ✅ agregado
router.get('/:productoId/portafolio', mostrarPortafolioPorProducto);

// Ruta dinámica al final
router.get('/:id', mostrarDetalle);

module.exports = router;