const express    = require('express');
const router     = express.Router();
const controller = require('../../controllers/admin/publicacionController');

// ── Rutas públicas ─────────────────────────────────────────────
router.get('/public/catalogo',   controller.getCatalogoPublico);   // con variantes + imágenes
router.get('/public/productos',  controller.getProductosPublicos); // simple sin variantes
router.get('/public/portafolio', controller.getPortafolioPublico);

// ── Rutas admin ────────────────────────────────────────────────
router.get('/admin/listado/:tabla',          controller.getListadoAdmin);
router.put('/admin/publicar/:tabla/:id',     controller.actualizarEstado);

module.exports = router;