const express = require('express');
const router = express.Router();
const { obtenerCompras, obtenerCompra, crearCompra, eliminarCompra } = require('../../controllers/admin/comprasController');

router.get('/', obtenerCompras);
router.get('/:id', obtenerCompra);
router.post('/', crearCompra);
router.delete('/:id', eliminarCompra);

module.exports = router;