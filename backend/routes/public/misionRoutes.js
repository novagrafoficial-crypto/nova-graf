// backend/routes/public/misionRoutes.js
const express = require('express');
const router = express.Router();
const misionController = require('../../controllers/public/misionController');

// Ruta para obtener la misión
router.get('/mision', misionController.getMision);

module.exports = router;