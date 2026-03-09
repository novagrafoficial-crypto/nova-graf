const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const ctrl     = require('../../controllers/admin/productosController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/catalogos',            ctrl.obtenerCatalogos);
router.get('/',                     ctrl.obtenerProductos);
router.get('/:id',                  ctrl.obtenerProductoDetalle);
router.post('/',   upload.single('imagen'), ctrl.crearProducto);
router.put('/:id', upload.single('imagen'), ctrl.actualizarProducto);
router.delete('/:id',               ctrl.eliminarProducto);

// Variantes
router.post('/:id/variantes',                    ctrl.agregarVariante);
router.delete('/:id/variantes/:varianteId',      ctrl.eliminarVariante);
router.patch('/:id/variantes/:varianteId/stock', ctrl.actualizarStock);

module.exports = router;