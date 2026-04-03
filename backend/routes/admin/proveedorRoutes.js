const express = require('express');
const router = express.Router();
const proveedorController = require('../../controllers/admin/proveedorController');

router.post('/registrar', proveedorController.registrarProveedor);
router.get('/listar', proveedorController.obtenerProveedores);

module.exports = router;