// backend/routes/public/redesRoutes.js
const express = require('express');
const router = express.Router();
const redesController = require('../../controllers/public/redesController');

// GET /api/redes-sociales
router.get('/', redesController.getRedes);

module.exports = router;