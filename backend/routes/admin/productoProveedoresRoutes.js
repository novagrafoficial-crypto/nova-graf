const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/productoProveedoresController');


// Obtener proveedores de un producto
router.get('/productos/:producto_id/proveedores', ctrl.obtenerPorProducto);

// Agregar proveedor a un producto
router.post('/productos/:producto_id/proveedores', ctrl.agregar);

// Actualizar precio_costo
router.put('/proveedores-producto/:id', ctrl.actualizar);

// Eliminar relación
router.delete('/proveedores-producto/:id', ctrl.eliminar);

module.exports = router;