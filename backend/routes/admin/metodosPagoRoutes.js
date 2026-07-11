const express = require('express');
const router = express.Router();

const { obtenerMetodosPago, obtenerMetodoPago, actualizarMetodoPago, toggleActivo, crearMetodoPago } = require('../../controllers/admin/metodosPagoController');

router.post('/', crearMetodoPago);
router.get('/', obtenerMetodosPago);
router.get('/:id', obtenerMetodoPago);
router.put('/:id', actualizarMetodoPago);
router.patch('/:id/activo', toggleActivo);

module.exports = router;