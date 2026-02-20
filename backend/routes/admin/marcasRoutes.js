const express = require('express');
const router = express.Router();

const marcasController = require('../../controllers/admin/marcasController');

router.get('/', marcasController.obtenerMarcas);
router.post('/', marcasController.crearMarca);
router.put('/:id', marcasController.actualizarMarca);
router.delete('/:id', marcasController.eliminarMarca);

module.exports = router;
