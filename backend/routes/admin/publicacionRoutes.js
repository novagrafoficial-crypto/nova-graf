const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/publicacionController');

// Rutas públicas (para el frontend de clientes)
router.get('/public/productos',   controller.getProductosPublicos);
router.get('/public/portafolio',  controller.getPortafolioPublico); // ← AGREGAR

// Rutas privadas admin
router.put('/admin/publicar/:tabla/:id', controller.actualizarEstado);
router.get('/admin/listado/:tabla',      controller.getListadoAdmin);

module.exports = router;