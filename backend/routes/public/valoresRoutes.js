// backend/routes/public/valoresRoutes.js
const express = require('express');
const router = express.Router();
const valoresController = require('../../controllers/public/valoresController');

// Ruta para obtener los valores
router.get('/valores', valoresController.getValores);

module.exports = router;