// backend/routes/public/empresaRoutes.js
const express = require('express');
const router = express.Router();
const empresaController = require('../../controllers/public/empresaController');

router.get('/', empresaController.getEmpresa);

module.exports = router;