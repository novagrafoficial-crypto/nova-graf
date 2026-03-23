const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/publicacionController');

// Ruta pública (para el frontend de clientes)
router.get('/public/productos', controller.getProductosPublicos);

// Rutas privadas (deberías protegerlas con middleware de autenticación)
router.put('/admin/publicar/:tabla/:id', controller.actualizarEstado);
router.get('/admin/listado/:tabla', controller.getListadoAdmin);

module.exports = router;