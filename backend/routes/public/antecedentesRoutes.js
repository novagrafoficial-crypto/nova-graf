// backend/routes/public/antecedentesRoutes.js
const express = require('express');
const router  = express.Router();
const antecedentesController = require('../../controllers/public/antecedentesController');

// GET /api/public/antecedentes
router.get('/', antecedentesController.getAntecedentes);

module.exports = router;