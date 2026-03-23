// backend/routes/public/misionRoutes.js
const express = require('express');
const router = express.Router();
const visionController = require('../../controllers/public/visionController');

// Ruta para obtener la misión
router.get('/vision', visionController.getVision);

module.exports = router;