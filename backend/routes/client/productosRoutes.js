// backend/routes/client/productosRoutes.js
const express = require('express');
const router = express.Router();
const {
  mostrarCatalogo,
  mostrarDetalle,
} = require('../../controllers/client/productosController');

// GET /api/client/productos/catalogo  → lista resumida
router.get('/catalogo', mostrarCatalogo);

// GET /api/client/productos/:id       → detalle completo
router.get('/:id', mostrarDetalle);

module.exports = router;