const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const ctrl           = require('../../controllers/admin/productosController');
const detectarAtaque = require('../../src/middlewares/rasp');

const upload = multer({ storage: multer.memoryStorage() });

// ── Validadores de IDs ────────────────────────────────────

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

// ── Catálogos ─────────────────────────────────────────────

router.get('/catalogos', ctrl.obtenerCatalogos);

// ── Productos ─────────────────────────────────────────────

router.get('/',    ctrl.obtenerProductos);
router.get('/:id', validarId, ctrl.obtenerProductoDetalle);

// 🔒 RASP va antes de multer para analizar el body JSON
router.post('/',
  detectarAtaque,
  upload.any(),
  ctrl.crearProducto
);

router.put('/:id',
  validarId,
  detectarAtaque,   // 🔒 RASP antes de multer
  upload.any(),
  ctrl.actualizarProducto
);

router.delete('/:id', validarId, ctrl.eliminarProducto);

// ── Variantes ─────────────────────────────────────────────

router.post('/:id/variantes',
  validarId,
  detectarAtaque,   // 🔒 RASP también en variantes
  ctrl.agregarVariante
);

router.put('/:id/variantes/:varianteId',
  validarId,
  validarVarianteId,
  detectarAtaque,
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
  detectarAtaque,
  ctrl.actualizarStock
);

module.exports = router;