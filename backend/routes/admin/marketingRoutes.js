const express = require('express');
const router = express.Router();
const {
  obtenerDescuentos, obtenerDescuento, crearDescuento,
  actualizarDescuento, publicarDescuento, eliminarDescuento
} = require('../../controllers/admin/marketingController');

router.get('/', obtenerDescuentos);
router.get('/:id', obtenerDescuento);
router.post('/', crearDescuento);
router.put('/:id', actualizarDescuento);
router.patch('/:id/publicar', publicarDescuento);
router.delete('/:id', eliminarDescuento);

module.exports = router;