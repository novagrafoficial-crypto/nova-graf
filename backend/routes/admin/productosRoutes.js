const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const ctrl = require('../../controllers/admin/productosController');

// ─── MULTER (memoria, sin guardar archivo) ────────────────
// El frontend manda FormData para que los campos JSON string
// lleguen parseados. No guardamos ningún archivo en disco
// porque las imágenes van directo a Supabase Storage desde
// el frontend. Multer solo se usa para poder leer req.body
// cuando Content-Type es multipart/form-data.

const upload = multer({ storage: multer.memoryStorage() });

// ─── MIDDLEWARES: VALIDAR IDs ─────────────────────────────

const validarId = (req, res, next) => {
  if (isNaN(req.params.id))
    return res.status(400).json({ error: 'ID inválido' });
  next();
};

const validarVarianteId = (req, res, next) => {
  if (isNaN(req.params.varianteId))
    return res.status(400).json({ error: 'ID de variante inválido' });
  next();
};

// ─── CATÁLOGOS ────────────────────────────────────────────

router.get('/catalogos', ctrl.obtenerCatalogos);

// ─── PRODUCTOS ────────────────────────────────────────────

router.get('/',    ctrl.obtenerProductos);
router.get('/:id', validarId, ctrl.obtenerProductoDetalle);

// upload.any() acepta FormData con cualquier campo (incluyendo
// el campo "imagen" que manda el frontend actual) sin guardar nada
router.post('/',
  upload.any(),
  ctrl.crearProducto
);

router.put('/:id',
  validarId,
  upload.any(),
  ctrl.actualizarProducto
);

router.delete('/:id', validarId, ctrl.eliminarProducto);

// ─── VARIANTES ────────────────────────────────────────────

router.post('/:id/variantes',
  validarId,
  ctrl.agregarVariante
);

router.put('/:id/variantes/:varianteId',
  validarId,
  validarVarianteId,
  ctrl.actualizarVariante
);

router.delete('/:id/variantes/:varianteId',
  validarId,
  validarVarianteId,
  ctrl.eliminarVariante
);

router.patch('/:id/variantes/:varianteId/stock',
  validarId,
  validarVarianteId,
  ctrl.actualizarStock
);

module.exports = router;