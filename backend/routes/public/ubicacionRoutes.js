// backend/routes/public/ubicacionRoutes.js
const express = require('express');
const router  = express.Router();
const ubicacionController = require('../../controllers/public/ubicacionController');

// GET /api/ubicacion
router.get('/', ubicacionController.getUbicacion);

module.exports = router;