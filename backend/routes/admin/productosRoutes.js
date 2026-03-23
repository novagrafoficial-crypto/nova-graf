const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const ctrl = require('../../controllers/admin/productosController');

// ─── CONFIGURACIÓN DE MULTER ─────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + path.extname(file.originalname);
    cb(null, nombre);
  }
});

const upload = multer({ storage });

// ─── MIDDLEWARE VALIDAR ID ─────────────────────────────

const validarId = (req, res, next) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({
      error: "ID inválido"
    });
  }

  next();
};

// ─── RUTAS ─────────────────────────────────────────────

// Catálogos auxiliares
router.get('/catalogos', ctrl.obtenerCatalogos);

// Productos
router.get('/', ctrl.obtenerProductos);
router.get('/:id', validarId, ctrl.obtenerProductoDetalle);

// Crear producto
router.post(
  '/',
  upload.single('imagen'),
  ctrl.crearProducto
);

// Actualizar producto
router.put(
  '/:id',
  validarId,
  upload.single('imagen'),
  ctrl.actualizarProducto
);

// Eliminar producto
router.delete(
  '/:id',
  validarId,
  ctrl.eliminarProducto
);

// ─── VARIANTES ─────────────────────────────────────────

// Crear variante
router.post(
  '/:id/variantes',
  validarId,
  ctrl.agregarVariante
);

// Eliminar variante
router.delete(
  '/:id/variantes/:varianteId',
  ctrl.eliminarVariante
);

// Actualizar stock
router.patch(
  '/:id/variantes/:varianteId/stock',
  ctrl.actualizarStock
);

module.exports = router;