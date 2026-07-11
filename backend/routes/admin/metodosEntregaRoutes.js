const express = require('express');
const router = express.Router();
const { obtenerMetodosEntrega, crearMetodoEntrega, actualizarMetodoEntrega, toggleActivo } = require('../../controllers/admin/metodosEntregaController');

router.get('/', obtenerMetodosEntrega);
router.post('/', crearMetodoEntrega);
router.put('/:id', actualizarMetodoEntrega);
router.patch('/:id/activo', toggleActivo);

module.exports = router;