// backend/routes/client/productosRoutes.js
const express = require('express');
const router = express.Router();
const {
  mostrarCatalogo,
  mostrarDetalle,
  mostrarCategorias,
} = require('../../controllers/client/productosController');

// GET /api/client/productos/catalogo
router.get('/catalogo', mostrarCatalogo);

// GET /api/client/productos/categorias
// ⚠️ Debe ir ANTES de /:id para que no lo intercepte
router.get('/categorias', mostrarCategorias);

// GET /api/client/productos/:id
router.get('/:id', mostrarDetalle);

module.exports = router;