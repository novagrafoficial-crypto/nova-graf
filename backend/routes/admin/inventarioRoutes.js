// routes/admin/inventarioRouter.js

const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/inventarioController');

// ─── Middleware: validar que el ID sea numérico ───────────────────────────────
const validarId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido. Debe ser un número entero positivo.' });
  }
  req.params.id = id; // normalizar
  next();
};

// ─── Rutas ────────────────────────────────────────────────────────────────────
router.get('/',                    ctrl.getInventario);
router.get('/reabastecimiento',    ctrl.getReabastecimiento);   // ← antes de /:id
router.get('/:id',  validarId,     ctrl.getInventarioPorId);

router.post('/',                   ctrl.createInventario);
router.put('/:id',  validarId,     ctrl.updateInventario);
router.delete('/:id', validarId,   ctrl.deleteInventario);

module.exports = router;